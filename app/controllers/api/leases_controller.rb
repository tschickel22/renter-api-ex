class Api::LeasesController < Api::ApiController
  include LeasesHelper
  skip_before_action :verify_authenticity_token, only: [:upload_lease_documents, :upload_move_out_documents]

  def model_class
    Lease
  end

  def primary_key_field
    :hash_id
  end

  def index
    query = base_query()
    query, total = page(query)
    render_json({ plural_object_key() => query.collect{|o| o.to_builder("partial").attributes! }, total: total })
  end

  def search
    leases = base_query
    leases = leases.joins({lease_residents: :resident}).where(["concat(residents.first_name, ' ', residents.last_name) like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?

    if !params[:status].blank? && params[:mode] != "applicants"
      if params[:mode] == "leads"
        leases = leases.where(application_status: Lease::APPLICATION_STATUS_LEAD) if params[:status] == "new"
      elsif params[:status] == 'move_in'
        leases = leases.where(status: Lease::STATUS_FUTURE).where("move_in_on <= curdate() + interval 30 day")
      elsif params[:status] == 'move_out'
        leases = leases.where(status: Lease::STATUS_CURRENT).where("lease_end_on <= curdate()")
      elsif params[:status] == 'expiring'
        days_to = !params[:days_to].blank? ? params[:days_to].to_i : 30
        days_from = !params[:days_from].blank? ? params[:days_from].to_i : 0
        leases = leases.left_outer_joins(:next_lease).where(next_lease: {id: nil}).where(status: Lease::STATUS_CURRENT).where("leases.lease_end_on between curdate() + interval #{days_from} day and curdate() + interval #{days_to} day")
      elsif params[:status] != 'all'
        leases = leases.where(status: params[:status])
      end
    end


    query, total = page(leases)
    render_json({ plural_object_key() => query.uniq.collect{|o| o.to_builder("partial").attributes! }, total: total })
  end

  def current
    leases = base_query
    leases = leases.where({status: [Lease::STATUS_FUTURE, Lease::STATUS_CURRENT, Lease::STATUS_FORMER]})
    leases = leases.where({property_id: params[:property_id]}) if !params[:property_id].blank?

    render_json({ plural_object_key() => leases.uniq.collect{|o| o.to_builder("partial").attributes! }})
  end

  def for_documents
    leases = base_query
    leases = leases.where({status: [Lease::STATUS_APPLICANT, Lease::STATUS_FUTURE, Lease::STATUS_CURRENT, Lease::STATUS_FORMER]})
    leases = leases.where({property_id: params[:property_id]}) if !params[:property_id].blank?

    render_json({ plural_object_key() => leases.uniq.collect{|o| o.to_builder("partial").attributes! }})
  end


  def setup_new_object()
    # This can be called from the unit listings page
    if current_user.present?
      object = model_class().new(company_id: current_user.company_id)
      object.status = Lease::STATUS_APPLICANT
      object.application_status = Lease::APPLICATION_STATUS_NEW
    else
      object = model_class().new(company_id: params[:lease][:company_id], property_id: params[:lease][:property_id])
      object.status = Lease::STATUS_APPLICANT
      object.application_status = Lease::APPLICATION_STATUS_NEW
    end

    return object
  end

  def handle_before_create_save
    LeaseService.handle_before_create_save(@object, current_user)
  end

  def base_query(includes_level = "partial")

    leases = Lease.for_user(current_user)

    if includes_level == "full"
      resident_includes = [:lease_resident_reports, :lead_info, resident: [:resident_payment_methods, :resident_pets, :resident_residence_histories, :resident_employment_histories, :resident_contact_emergencies, :resident_contact_references, :resident_vehicles]]
      leases = leases.includes([{primary_resident: resident_includes, secondary_residents: resident_includes, guarantors: resident_includes, occupants: resident_includes, minors: resident_includes}, :unit, :property])
    else
      leases = leases.includes([{primary_resident: :resident, secondary_residents: :resident, guarantors: :resident, occupants: :resident, minors: :resident}, :unit, :property])
    end

    leases = leases.where(property_id: params[:property_id]) if !params[:property_id].blank?

    if params[:mode] == "applicants"
      leases = leases.where(status: [Lease::STATUS_APPLICANT, Lease::STATUS_APPROVED])

      if [Lease::APPLICATION_STATUS_APPROVED, Lease::APPLICATION_STATUS_DECLINED].include?(params[:status])
        leases = leases.where(application_status: params[:status])
      elsif params[:status] == "no_decision"
        leases = leases.where.not(application_status: [Lease::APPLICATION_STATUS_APPROVED, Lease::APPLICATION_STATUS_DECLINED])
      end
    elsif params[:mode] == "residents"
      if params[:status] == Lease::STATUS_FORMER
        leases = leases.where(status: [Lease::STATUS_FORMER])
      else
        leases = leases.where(status: [Lease::STATUS_RENEWING, Lease::STATUS_FUTURE, Lease::STATUS_CURRENT])
      end
    end

    return leases
  end

  def handle_after_create
    handle_after_create_or_update()
  end

  def handle_after_update
    handle_after_create_or_update()
  end

  def create_existing
    # Leverage the upload logic to add an existing lease
    @object = Lease.new
    data = object_params

    data[:invite_to_portal] = params[:lease][:invite_to_portal]
    data[:lease_deposits_held] = data[:security_deposit].to_f if !data[:security_deposit].blank?
    data[:lease_rent] = data[:rent].to_f if !data[:rent].blank?

    if !params[:lease][:outstanding_balance_amount].blank?
      outstanding = parse_number_param(params[:lease], [:outstanding_balance_amount])
      data[:outstanding_balance_amount] = outstanding[:outstanding_balance_amount]
    end

    if data[:primary_resident_attributes].present? && data[:primary_resident_attributes][:resident_attributes].present?
      data[:primary_resident_first_name] = data[:primary_resident_attributes][:resident_attributes][:first_name]
      data[:primary_resident_last_name] = data[:primary_resident_attributes][:resident_attributes][:last_name]
      data[:primary_resident_email] = data[:primary_resident_attributes][:resident_attributes][:email]
      data[:primary_resident_phone] = data[:primary_resident_attributes][:resident_attributes][:phone_number]
    end

    if data[:secondary_residents_attributes].present? && !data[:secondary_residents_attributes].empty?
      data[:co_resident_1_first_name] = data[:secondary_residents_attributes][0][:resident_attributes][:first_name]
      data[:co_resident_1_last_name] = data[:secondary_residents_attributes][0][:resident_attributes][:last_name]
      data[:co_resident_1_email] = data[:secondary_residents_attributes][0][:resident_attributes][:email]
      data[:co_resident_1_phone] = data[:secondary_residents_attributes][0][:resident_attributes][:phone_number]

      if data[:secondary_residents_attributes][1].present?
        data[:co_resident_2_first_name] = data[:secondary_residents_attributes][1][:resident_attributes][:first_name]
        data[:co_resident_2_last_name] = data[:secondary_residents_attributes][1][:resident_attributes][:last_name]
        data[:co_resident_2_email] = data[:secondary_residents_attributes][1][:resident_attributes][:email]
        data[:co_resident_2_phone] = data[:secondary_residents_attributes][1][:resident_attributes][:phone_number]
      end
    end

    results = ResidentService.import_residents(current_user.company, [data])

    results = results.first

    if results[:status] == "error"
      render_json({errors: {base: results[:message]}}, false)
    else
      render_json(results)
    end
  end

  def handle_after_create_or_update()
    LeaseService.handle_after_create_or_update(@object, current_user, params.permit!.to_hash.deep_symbolize_keys)
  end

  def show
    if params[:id] == "my"
      lease = base_query("full").last
    else
      lease = base_query("full").where(primary_key_field() => params[:id]).first
    end

    if lease.present?
      render_json({ singular_object_key() => lease.to_builder_with_user(current_user).attributes! })
    else
      error = "No leases found"

      # Could this be an inactive property?
      lease = Lease.where(primary_key_field() => params[:id]).first

      error = "The owner of your property has de-activated their account." if lease.present? && (lease.property.nil? || lease.property.status == Property::STATUS_INACTIVE)

      render_json({errors: [error]}, false)
    end
  end

  def cancel_move_in
    load_object_for_update

    result = LeaseService.cancel_move_in(@object, params[:payments_to_refund])

    if result == :success
       render_successful_update()
    elsif result == :refund_failed
      render_json({errors: {base: "Unable to refund selected fees. Please contact support."}}, false)
    else
      render_failed_update
    end

  end

  def lease_documents
    load_object_for_update()
    render_lease_documents_json()
  end

  def destroy_lease_document
    load_object_for_update()
    ActiveRecord::Base.transaction do
      attachment = @object.documents.collect(&:attachment).detect{|a| a.id == params[:lease_document_id]}
      document = @object.documents.where(id: attachment.record_id).first
      attachment.purge
      document.destroy!
    end
    render_lease_documents_json()
  end

  def upload_lease_documents
    load_object_for_update()
    uploaded_file = params[:lease_document]

    if @object.present?
      doc = @object.documents.build(
        document_type: 'lease_document',
        company_id: @object.company_id,
        content_type: uploaded_file&.content_type&.to_s,
        document_name: uploaded_file&.original_filename&.to_s
      )

      doc.attachment.attach(params.permit(:lease_document)[:lease_document])

      if doc.save!
        render_lease_documents_json()
      else
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      render_json({errors: ["Lease not found"]}, false)
    end
  end

  def move_out_documents
    load_object_for_update()
    render_move_out_documents_json()
  end

  def destroy_move_out_document
    load_object_for_update()
    @object.move_out_documents.where(id: params[:move_out_document_id]).purge
    ActiveRecord::Base.transaction do
      attachment = @object.documents.collect(&:attachment).detect{|a| a.id == params[:move_out_document_id]}
      document = @object.documents.where(id: attachment.record_id).first
      attachment.purge
      document.destroy!
    end
    render_move_out_documents_json()
  end

  def upload_move_out_documents
    load_object_for_update()
    uploaded_file = params[:lease_document]

    if @object.present?
      doc = @object.documents.build(
        document_type: 'move_out_document',
        company_id: @object.company_id,
        content_type: uploaded_file&.content_type&.to_s,
        document_name: uploaded_file&.original_filename&.to_s
      )

      doc.attachment.attach(params.permit(:move_out_document)[:move_out_document])

      if doc.save!
        render_move_out_documents_json()
      else
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      render_json({errors: ["Lease not found"]}, false)
    end
  end

  def determine_check_printing_eligibility
    load_object_for_update()
    settings = @object.settings

    eligible_for_check_printing = false

    # First off... does this company even have check printing
    if settings.present? && settings.check_printing_enabled

      # Then, would the checking account that we'd be sending money from support it?
      bank_account = BankAccount.find_bank_account_for_refund(@object)

      eligible_for_check_printing = bank_account.present? && bank_account.check_printing_enabled
    end

    render_json({eligible_for_check_printing: eligible_for_check_printing}, true)
  end

  def residents
    if params[:id].present?
      lease = model_class().for_user(current_user).find_by(id: params[:id])
      if lease.present?
        residents = lease.residents.compact.map{|resident| {
            id: "lr_#{resident.id}" || SecureRandom.uuid,
            name: resident.first_name + " " + resident.last_name,
            email: resident.email,
            phone: resident.phone_number,
            role: "Resident"
          }
        }.uniq{|resident| resident[:id]}

        guarantors = lease.guarantors.compact.map{|guarantor|
          {
            id: "lr_#{guarantor.id}" || SecureRandom.uuid,
            name: guarantor.first_name + " " + guarantor.last_name,
            email: guarantor.email,
            phone: guarantor.phone_number,
            role: "Guarantor"
          }
        }.uniq{|resident| resident[:id]}

        company_users = lease.company.users.map{|user|
          {
            id: user.id || SecureRandom.uuid,
            name: user.first_name + " " + user.last_name,
            email: user.email,
            phone: user.phone_number,
            role: "Landlord"
          }
        }.uniq{|resident| resident[:id]}

        render_json({
          users: (residents + guarantors + company_users).compact,
        })
      else
        render_json({errors: ["Lease not found"]}, false)
      end
    else
      render_json({errors: ["Lease not found"]}, false)
    end
  end

  protected

  def object_params
    other_resident_shell = LeaseResident.public_fields() + [:_destroy, {resident: Resident.public_fields_with_date_of_birth()}]

    if params.present?
      pp = parse_number_param(params.require(:lease).permit(Lease.public_fields() + [:lease_action, :lease_term_other, primary_resident: LeaseResident.public_fields() + [{lead_info: LeadInfo.public_fields()}, {resident: lease_resident_resident_shell()}], secondary_residents: [other_resident_shell], occupants: [other_resident_shell], minors: [other_resident_shell], guarantors: [other_resident_shell]]), [:rent, :security_deposit])

      pp = handle_lease_residents(pp)

      if pp[:primary_resident]
        pp[:primary_resident_attributes] = handle_lease_resident(pp.delete(:primary_resident))
        pp[:primary_resident_attributes][:updated_at] = Time.now # Trigger validation
      end

      pp[:lease_term] = pp[:lease_term_other] if pp[:lease_term] == "other"
      pp.delete(:lease_term_other)
      pp.delete(:screening_payment_method)

      Rails.logger.error("\n\nLEASE PARAMS: #{pp.to_json}\n\n")

      return pp
    else
      return {}
    end
  end

  def render_move_out_documents_json
    move_out_documents = @object.documents.where(document_type: 'move_out_document').collect(&:attachment).collect{|ip| Lease.move_out_document_builder(ip).attributes!} if @object.present?
    render_json({ move_out_documents: move_out_documents  })
  end

  def render_lease_documents_json
    lease_documents = @object.documents.where(document_type: 'lease_document').collect(&:attachment).collect{|ip| Lease.lease_document_builder(ip).attributes!} if @object.present?
    render_json({ lease_documents: lease_documents  })
  end
end