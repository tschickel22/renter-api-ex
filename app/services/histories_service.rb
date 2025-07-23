class HistoriesService
  include ActionView::Helpers::NumberHelper
  include ApplicationHelper

  FIELDS_TO_EXCLUDE = [
    'id', 'created_at', 'updated_at', 'hash_id', 'company_id', 'lease_id','previous_lease_id', 'lease_resident_id', 'resident_id', 'type',
    'encrypted_credentials', 'encrypted_credentials_iv', 'encrypted_routing_number', 'encrypted_routing_number_iv',
    'encrypted_account_number', 'encrypted_account_number_iv', 'encrypted_tax_id', 'encrypted_tax_id_iv',
    'encrypted_nelco_password', 'encrypted_nelco_password_iv', 'encrypted_ssn', 'encrypted_ssn_iv',
    'encrypted_ein', 'encrypted_ein_iv', 'encrypted_report_content', 'encrypted_report_content_iv',
    'encrypted_plate_number', 'encrypted_plate_number_iv', 'encrypted_date_of_birth',
    'encrypted_date_of_birth_iv', 'encrypted_id_card_number', 'encrypted_id_card_number_iv', 'encrypted_password',
    'last_sign_in_ip', 'last_sign_in_at', 'current_sign_in_at', 'current_sign_in_ip', 'sign_in_count',
    'last_update_from_app_at', 'screening_agreement_ip_address', 'income', 'income_notes',
    'external_screening_id', 'external_subscription_id', 'reset_password_token', 'lat', 'lng',
    'screening_attestation', 'external_credit_builder_id', 'current_lease_id'
  ]

  FIELDS_TO_RENAME = {
    'last_update_from_app_at' => 'Updated in app at',
  }

  LABEL_LOOKUP_FIELDS = {
    'Property.property_type' => Property::TYPE_OPTIONS,
    'LeaseResident.current_step' => LeaseResident::STEP_OPTIONS,
    'Lease.status' => Lease::STATUS_OPTIONS,
    'Insurance.status' => Insurance::STATUS_OPTIONS,
    'User.user_type' => User::TYPE_OPTIONS
  }

  CURRENCY_FIELDS = [
    'amount', 'amount_paid', 'rent', 'security_deposit',
  ]

  NONE_HTML = '<em>(none)</em>'.html_safe
  REMOVED_HTML = '<em>removed</em>'.html_safe
  CHANGE_ICON = '<i class="far fa-arrow-alt-circle-right"></i>'.html_safe

  attr_accessor :all_changesets

  def initialize
    @all_changesets = []
    @record_objects = {}
  end

  def user_history_logs(user, current_user, start_date, end_date)

    by_item = Versions::Company.where(created_at: start_date..end_date).where(whodunnit: user.id.to_s).group_by{|v| [v.item_type, v.item_id]}
    by_item.each do | (item_type, item_id), versions |
      add_changeset("#{item_type} #{item_id}", item_type.humanize.titlecase, versions, current_user: current_user)
    end

    sort_changeset!

    self
  end

  def property_history_logs(property, current_user, start_date, end_date)
    if property.present?
      add_changeset('Property', nil, property.versions.where(created_at: start_date..end_date), current_user: current_user)

      Unit.unscoped.where(property_id: property.id).all.each do |u|
        add_changeset(u.name, "Unit", u.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

      Setting.unscoped.where(company_id: property.company_id, property_id: property.id).all.each do |o|
        add_changeset(o.name, "Setting", o.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

    end

    sort_changeset!

    self
  end

  def company_history_logs(company, current_user, start_date, end_date)

    if company.present?
      add_changeset('Company', nil, company.versions.where(created_at: start_date..end_date), current_user: current_user)

      Property.includes(:units).unscoped.where(company_id: company.id).all.each do |o|
        add_changeset(o.name, "Property", o.versions.where(created_at: start_date..end_date), current_user: current_user)

        Unit.unscoped.where(property_id: o.id).all.each do |u|
          add_changeset(u.name, "Unit", u.versions.where(created_at: start_date..end_date), current_user: current_user)
        end
      end

      User.unscoped.where(company_id: company.id).all.each do |o|
        add_changeset(o.name, "User", o.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

      Setting.unscoped.where(company_id: company.id).all.each do |o|
        add_changeset(o.name, "Setting", o.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

    end

    sort_changeset!

    self
  end

  def lease_history_logs(lease, current_user, start_date, end_date)

    if lease.present?
      add_changeset('Lease', nil, lease.versions.where(created_at: start_date..end_date), current_user: current_user)

      Charge.unscoped.where(lease_id: lease.id).all.each do |o|
        add_changeset(o.description_pretty, "Charge", o.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

      LedgerItem.unscoped.where(lease_id: lease.id).all.each do |o|
        add_changeset(o.description_pretty, "Ledger Item", o.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

      Document.unscoped.where(lease_id: lease.id).all.each do |o|
        add_changeset(o.document_name, "Document", o.versions.where(created_at: start_date..end_date), current_user: current_user)
      end

      LeaseResident.includes(:resident).unscoped.where(lease_id: lease.id).all.each do |o|
        add_changeset(o.name,"Resident", o.versions.where(created_at: start_date..end_date), current_user: current_user)

        Resident.unscoped.where(id: o.resident_id).all.each do |r|
          add_changeset(r.name, "Resident", r.versions.where(created_at: start_date..end_date), current_user: current_user)
        end

        Insurance.unscoped.where(lease_resident_id: o.id).all.each do |i|
          add_changeset("Policy for #{o.name}", "Insurance", i.versions.where(created_at: start_date..end_date), current_user: current_user)
        end
      end

    end

    sort_changeset!

    self
  end


  def add_changeset(title, sub_title, versions, model = nil, versioned_object: nil, current_user: nil)
    versions.each do |version|
      next if version.changeset.empty?
      if model.nil? || model.show_version?(version)
        changes_html = (version.event == 'destroy' ? '<strong>Deleted</strong>'.html_safe : format_charges_diff(version, current_user: current_user))
        user_full_name = build_user_info(version.whodunnit, current_user: current_user)
        @all_changesets << {title: title, sub_title: sub_title, user_id: version.whodunnit, user_full_name: user_full_name, changes_html: changes_html, updated_at: version.created_at, id: version.id } unless changes_html.blank?
      end
    end
    self
  end

  def build_user_info(obj_id, current_user: nil)
    user = User.where(id: obj_id).first
    user_info = user&.full_name

    if user.present?
      if user.is_resident?
        user_info += " (#{user.user_type.humanize.titlecase})"
      elsif current_user.present? && !current_user.is_admin? && user.company_id != current_user.company_id
        user_info += " (#{user.user_type.humanize.titlecase})"
      end
    end

    user_info
  end

  def format_charges_diff(version, current_user: nil)
    changeset = version.changeset
    return nil unless changeset.present?

    fields_to_return = Array.new

    @last_diff_version = {version: version, was_newly_added: (version.event == 'create'), was_deleted: (version.event == 'destroy')}
    fields_to_return << "<strong>Added</strong>".html_safe if @last_diff_version[:was_newly_added]
    fields_to_return << "<strong>Removed</strong>".html_safe if @last_diff_version[:was_deleted]

    changeset.each do | k,v |
      next if FIELDS_TO_EXCLUDE.include?(k) # Skip a few fields from showing

      next if v.first.blank? && v.last.blank? # skip fields that didn't really change, eg went from null to empty string or 0

      field_name = FIELDS_TO_RENAME.include?(k) ? FIELDS_TO_RENAME[k] : k.titleize
      @current_field = k

      if LABEL_LOOKUP_FIELDS.include?("#{version.item_type}.#{k}")
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do label_lookup(v.first, LABEL_LOOKUP_FIELDS["#{version.item_type}.#{k}"]) || NONE_HTML end} #{label_lookup(v.last, LABEL_LOOKUP_FIELDS["#{version.item_type}.#{k}"])}".html_safe
      elsif CURRENCY_FIELDS.include?(k)
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do number_to_currency(v.first) end} #{number_to_currency(v.last)}".html_safe
      elsif k == 'deleted_at'
        if v.first.nil?
          fields_to_return << "<strong>Deleted</strong>".html_safe
        elsif v.last.nil?
          fields_to_return << "<strong>Recovered</strong>".html_safe
        end
      elsif is_datetime_field?(k, v)
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do format_datetime(v.first, NONE_HTML, current_user: current_user) end} #{format_datetime(v.last, current_user: current_user)}".html_safe
      elsif is_date_field?(k, v)
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do format_date(v.first, NONE_HTML) end} #{format_date(v.last)}".html_safe
      elsif k == 'property_id'
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do format_object(Property, v.first, NONE_HTML) end} #{format_object(Property, v.last)}".html_safe
      elsif k == 'unit_id'
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do format_object(Unit, v.first, NONE_HTML) end} #{format_object(Unit, v.last)}".html_safe
      elsif k == 'charge_type_id'
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do format_object(ChargeType, v.first, NONE_HTML) end} #{format_object(ChargeType, v.last)}".html_safe
      elsif k == 'api_partner_id'
        fields_to_return << "<strong>#{field_name}:</strong> #{concat_previous do format_object(ApiPartner, v.first, NONE_HTML) end} #{format_object(ApiPartner, v.last)}".html_safe
      elsif k == 'user_role_id'
        fields_to_return << "<strong>#{field_name}:</strong> #{format_object_change(UserRole, v)}".html_safe
      else
        initial_value = v.first
        new_value = v.last

        if new_value.nil?
          new_value = (initial_value.present? ? REMOVED_HTML : NONE_HTML)
        elsif new_value.blank? && !(new_value === false)
          new_value = (initial_value.present? ? REMOVED_HTML : '')
        end

        initial_value = initial_value.blank? ? NONE_HTML : ERB::Util.h(initial_value)
        new_value = ERB::Util.h(new_value) unless new_value.html_safe?

        fields_to_return << "<strong>#{ERB::Util.h(field_name)}:</strong> #{concat_previous do (initial_value || NONE_HTML) end} #{new_value}".html_safe
      end
    end

    @current_field = nil
    @last_diff_version = nil
    return fields_to_return.join("<br>").html_safe
  end

  def sort_changeset!
    @all_changesets.sort! do |a,b|
      co = b[:updated_at] <=> a[:updated_at]
      co == 0 ? (b[:id] <=> a[:id]) : co
    end
  end

  def format_object_change(klass, v)
    "#{concat_previous do format_object(klass, v.first, NONE_HTML) end} #{format_object(klass, v.last)}"
  end

  def concat_previous
    return nil if @last_diff_version[:was_newly_added]

    "#{yield} #{CHANGE_ICON}"
  end

  def is_datetime_field?(k, v)
    k.ends_with?('_at')
  end

  def format_datetime(val, fallback = nil, current_user: nil)
    return fallback if !val
    # Eventually: current_user&.timezone
    return val.in_time_zone('US/Mountain').strftime('%m/%d/%Y %l:%M %p %Z') if val.respond_to?(:strftime)
    begin
      tval = Time.parse(val)
      format_datetime(tval, fallback, current_user: current_user)
    rescue
      (val || fallback)
    end
  end

  def is_date_field?(k, v)
    k.ends_with?('_on')
  end

  def format_object(klass, val, fallback = nil)
    return (fallback || REMOVED_HTML) if val.nil?

    object = get_object_by_id(klass, val)
    object.present? ? ERB::Util.h(object.name) : "<em>#{klass} deleted</em>"
  end

  def format_date(val, fallback = nil)
    return fallback if !val
    return val.strftime('%m/%d/%Y') if val.respond_to?(:strftime)
    begin
      tval = Date.parse(val)
      format_date(tval, fallback)
    rescue
      (val || fallback)
    end
  end

  def get_object_by_id(klass, id, getter = nil)
    @record_objects[klass] ||= {}
    if @record_objects[klass].has_key?(id)
      @record_objects[klass][id]
    else
      memo_value = if getter && getter.respond_to?(:call)
                     getter.call
                   elsif klass.respond_to?(:where) && !id.nil?
                     qklass = klass.unscope(where: :deleted_at) if klass.respond_to?(:unscope)
                     qklass.where(id: id).first
                   end
      set_object_by_id(klass, id, memo_value)
    end
  end

  def set_object_by_id(klass, id, memo_value)
    @record_objects[klass] ||= {}
    @record_objects[klass][id] = memo_value
  end

end