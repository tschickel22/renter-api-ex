class Api::InsurancesController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_declarations]

  def model_class
    Insurance
  end

  def primary_key_field
    :hash_id
  end

  def search
    if !params[:lease_id].blank?
      lease = Lease.where(hash_id: params[:lease_id]).first
      if current_user.is_resident?
        lease_resident = LeaseResident.where(resident_id: current_user.resident.id, lease_id: lease.id).first
        insurances = Insurance.where(lease_resident_id: lease_resident.id)
      else
        insurances = Insurance.joins(:lease_resident).where(lease_resident: {lease_id: lease.id})
      end

      render_json({insurances: insurances}, true)
    end
  end

  def switch_api_partner
    if !params[:insurance][:lease_id].blank?
      # Look for an existing record for this api partner
      lease = Lease.where(hash_id: params[:insurance][:lease_id]).first
      lease_resident = LeaseResident.where(resident_id: current_user.resident.id, lease_id: lease.id).first
      @object = Insurance.where(lease_resident_id: lease_resident.id, api_partner_id: params[:insurance][:api_partner_id]).first

      if @object.nil?
        @object = Insurance.build_for_current_user(current_user, lease, lease_resident)
        @object.api_partner_id = params[:insurance][:api_partner_id]
      end

      if params[:insurance][:api_partner_id] == RenterInsightMsiApi::API_PARTNER_ID
        @object.insurance_company_name = "Millennial Specialty Insurance"
      end

      @object.save(validate: false)

      render_json({insurance: @object}, true)
    end
  end

  def confirm
    if current_user.is_resident?
      # Automatically select the insurance
      # api_partner_id == RenterInsightMsiApi::API_PARTNER_ID
      insurances = Insurance.joins(:lease_resident).where(lease_resident: {resident_id: current_user.resident.id})

      # Is there only one?
      if insurances.count == 1
        insurance = insurances.first
      else
        # Look for new policies
        if insurances.where(status: Insurance::STATUS_NEW, api_partner_id: RenterInsightMsiApi::API_PARTNER_ID).count == 1
          insurance = insurances.where(status: Insurance::STATUS_NEW, api_partner_id: RenterInsightMsiApi::API_PARTNER_ID).last
        # Just use the last one
        else
          insurance = insurances.last
        end
      end

      insurance.update(status: Insurance::STATUS_ACTIVE) if insurance.present?

      render_json({insurance: insurance}, true)
    end
  end

  def handle_before_create
    if !params[:insurance][:lease_id].blank?
      lease = Lease.where(hash_id: params[:insurance][:lease_id]).first
      lease_resident = LeaseResident.where(resident_id: current_user.resident.id, lease_id: lease.id).first
      existing_insurance = Insurance.where(lease_resident_id: lease_resident.id).last

      if existing_insurance.nil?
        @object = Insurance.build_for_current_user(current_user, lease, lease_resident)
      else
        @object = existing_insurance
        @object.api_partner_id = params[:insurance][:api_partner_id]
        @object.status = Insurance::STATUS_NEW if existing_insurance.api_partner_id != RenterInsightMsiApi::API_PARTNER_ID # Switching insurances
      end

      @object.insurance_company_name = "Millennial Specialty Insurance" if @object.api_partner_id == RenterInsightMsiApi::API_PARTNER_ID
    end
  end

  def handle_before_update_save()
    if @object.internal_policy? && !@object.is_active?
      @object.status = Insurance::STATUS_ACTIVE
    end
  end


  def declarations
    load_object_for_update()
    render_declarations_json()
  end

  def destroy_declaration
    load_object_for_update()
    @object.declarations.where(id: params[:declaration_id]).purge
    render_declarations_json()
  end

  def upload_declarations
    file_params = params.permit(:id, :declaration, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: Insurance.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:declaration])
      unattached_file_batch.save

      declarations = unattached_file_batch.files.collect{|ip| Insurance.declaration_builder(ip).attributes!}
      render_json({ declarations: declarations  })
    else
      load_object_for_update()

      if @object.present?
        @object.declarations.attach(params.permit(:declaration)[:declaration])

        if @object.save(validate: false)
          render_declarations_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["Insurance not found"]}, false)
      end
    end
  end
  protected

  def object_params
    pp = parse_number_param(params.require(:insurance).permit(Insurance.public_fields() + [:hash_id]), [:liability_limit]) || {}

    return pp
  end

  def render_declarations_json
    declarations = @object.declarations.collect{|ip| Insurance.declaration_builder(ip).attributes!} if @object.present?
    render_json({ declarations: declarations  })
  end
end