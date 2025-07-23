class Api::SettingsController < Api::ApiController

  def model_class
    Setting
  end

  def setup_new_object()
    get_base_setting()
  end

  def load_object_for_update
    @object = get_base_setting()
  end

  def handle_before_save
    setting_group = Setting.config[params[:setting][:group_key].to_sym]

    if setting_group && setting_group[:admin_only] && !current_actual_user.is_admin?
      raise "This section is only editable by Renter Insight Support."
    end
  end

  def handle_before_create_save
    handle_before_save()
  end

  def handle_before_update_save
    handle_before_save()
  end



  def handle_after_update
    if @object.company_id.present? && @object.property_id.nil?
      # Find any settings that are marked as push_down_to_properties and see if they've changed
      settings_changed = {}

      Setting.get_push_down_to_properties_setting_keys.each do | setting_key |
        if @object.send("saved_change_to_#{setting_key}?".to_sym)
          settings_changed[setting_key] = @object[setting_key]
        end
      end

      # If so, push this down to all property settings
      if !settings_changed.blank?
        Setting.where(company_id: @object.company_id).where.not(property_id: nil).each do | property_setting|
          property_setting.assign_attributes(settings_changed)
          property_setting.save(validate: false)
        end
      end
    end

  end

  def show
    render_json({  setting: get_base_setting() })
  end

  protected

  def get_base_setting
    global_setting = Setting.where(company_id: nil, property_id: nil).first

    if current_user.is_admin? && params[:mode] == "system"
      return global_setting
    end

    company_setting = Setting.where(company_id: current_user.company_id, property_id: nil).first
    company_setting = Setting.new(global_setting.attributes.merge({id: nil, company_id: current_user.company_id})) if company_setting.nil?

    if !params[:property_id].blank?
      property_id = params[:property_id]
    elsif params[:setting].present? && !params[:setting][:property_id].blank?
      property_id = params[:setting][:property_id]
    end

    if !property_id.blank?
      property_setting = Setting.where(company_id: current_user.company_id, property_id: property_id).first
      property_setting = Setting.new(company_setting.attributes.merge({id: nil, company_id: current_user.company_id, property_id: property_id})) if property_setting.nil?

      return property_setting
    else
      return company_setting
    end

  end

  def object_params
    parse_number_param(params.require(:setting).permit(Setting.public_fields + [:group_key]), [:payment_fee_ach_property, :payment_fee_ach_resident, :payment_fee_credit_card_property, :payment_fee_credit_card_resident, :payment_fee_debit_card_property, :payment_fee_debit_card_resident, :late_rent_fee_charge_fixed, :late_rent_fee_charge_daily, :late_rent_fee_charge_percentage, :late_rent_fee_minimum_amount, :late_rent_fee_maximum_amount, :application_fee, :rate_per_mile, :nsf_fee])
  end
end