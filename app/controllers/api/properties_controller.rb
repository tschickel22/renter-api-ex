class Api::PropertiesController < Api::ApiController

  skip_before_action :verify_authenticity_token, only: [:upload]

  def model_class
    Property
  end

  def index
    properties = model_class().for_user(current_user)
    properties = properties.includes(:units, :leases, :property_ownerships).order(:name)

    data = { plural_object_key() => properties }

    # Gather all floor plans
    floor_plan_names = {}

    properties.each do | p |
      p.units.each do | unit |
        next if unit.floor_plan_name.blank?

        floor_plan_names[unit.floor_plan_name] = {beds: unit.beds, baths: unit.baths, square_feet: unit.square_feet}
      end
    end

    data[:floor_plan_names] = floor_plan_names

    render_json(data)
  end

  def perform_search(properties)
    properties = properties.where(["name like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?
    properties = properties.where(status: params[:status]) if !params[:status].blank? && params[:status] != "all"

    return properties
  end

  def handle_after_create
    # Check to see if the property's company is active for screening. If it is, activate the property
    if @object.company.screening_is_activated?
      ActivateForScreening.enqueue(Property.to_s, @object.id, current_user.id)
    end

    ActivateForInsurance.enqueue(Property.to_s, @object.id, current_user.id)

    # If a company user added this property... we need to give them access
    if current_user.present? && current_user.is_company_user?
      UserAssignment.create(entity: @object, user_id: current_user.id)
    end
  end

  def handle_before_update()
    @existing_property_ownerships = @object.property_ownerships.collect{|po| po.id}
  end

  def handle_after_update()
    # Should we remove any?
    po_attrs = object_params[:property_ownerships_attributes]

    if po_attrs
      pushed_property_ownerships = po_attrs.collect{|po| po[:id]}
      po_to_delete = @existing_property_ownerships - pushed_property_ownerships

      if !po_to_delete.empty?
        PropertyOwnership.where(property_id: @object.id, id: po_to_delete).destroy_all
        @object.reload
      end
    end
  end

  def screening_activation
    load_object_for_update()

    if ActivateForScreening.perform(Property.to_s, @object.id, current_user.id)
      render_successful_update()
    else
      # Now, we need to call TransUnion in order to push the landlord record
      @object.errors.add(:base, "Unable to activate screening. Please contact Renter Insight Support.")
      render_json({errors: extract_errors_by_attribute(@object)}, false)
    end
  end

  def screening_attestations
    load_object_for_update()

    if @object.screening_attestation.nil?
      attestation_data = RenterInsightTransUnionApi.new.get_property_attestations(@object)

      if attestation_data.present?

        # Are there questions that need answering? If not, save empty responses and move on
        if attestation_data["attestations"].blank?
          new_attestation_data = {attestationGroupId: attestation_data['attestationGroupId'], attestationResponses: []}

          @object.screening_attestation = new_attestation_data
          @object.save(validate: false)
        end

        render_json({attestation_data: attestation_data}, success: true)
      else
        # Now, we need to call TransUnion in order to push the landlord record
        @object.errors.add(:base, "Unable to load attestation data. Please contact Renter Insight Support.")
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      render_json({attestation_data: {attestations: []}}, success: true)
    end
  end

  def save_screening_attestations
    load_object_for_update()

    new_attestation_data = {attestationGroupId: params['attestation_data']['attestationGroupId'], attestationResponses: []}
    params['attestation_data']['attestations'].each do | attestation |
      new_attestation_data[:attestationResponses] << {attestationId: attestation['attestationId'], isAffirmative: true}
    end

    @object.screening_attestation = new_attestation_data
    @object.save(validate: false)

    render_successful_update
  end

  def deactivate
    load_object_for_update()

    @object.deactivate()

    render_successful_update()
  end

  def reactivate
    load_object_for_update()

    @object.reactivate()

    render_successful_update()
  end

  def destroy
    load_object_for_update()

    @object.destroy

    render_successful_update()
  end

  def upload
    # Save uploaded spreadsheet (good for debugging)
    name = params[:properties_upload].original_filename
    dir = File.join("uploads", "#{current_user.company_id}", "properties")
    FileUtils.makedirs( dir ) if !Dir.exists?(dir)
    path = File.join(dir, name)
    File.open(path, "wb") { |f| f.write(params[:properties_upload].read) }

    import_results = PropertyService.import_from_spreadsheet(current_user.company, path)
    results = Hash.new

    import_results.each_with_index do | row, index |
      results[index + 2] = row
    end

    render_json({results: results}, true)

  end

  def residents
    if params[:id].present?
      property =  model_class().for_user(current_user).find_by(id: params[:id])
      if property.present?
        leases = property.leases.where({status: [Lease::STATUS_APPLICANT, Lease::STATUS_FUTURE, Lease::STATUS_CURRENT, Lease::STATUS_FORMER]})
        residents = leases.collect(&:residents).flatten.compact.map{|resident| {
            id: "lr_#{resident.id}" || SecureRandom.uuid,
            name: resident.first_name + " " + resident.last_name,
            email: resident.email,
            phone: resident.phone_number,
            role: "Resident"
          }
        }.uniq{|resident| resident[:id]}

        guarantors = leases.collect(&:guarantors).flatten.compact.map{|guarantor|
          {
            id: "lr_#{guarantor.id}" || SecureRandom.uuid,
            name: guarantor.first_name + " " + guarantor.last_name,
            email: guarantor.email,
            phone: guarantor.phone_number,
            role: "Guarantor"
          }
        }.uniq{|resident| resident[:id]}

        company_users = property.company.users.map{|user|
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
        render_json({errors: ["Property not found"]}, false)
      end
    else
      render_json({errors: ["Property not found"]}, false)
    end
  end

  protected

  def object_params
    if params.present?
      pp = params.require(:property).permit(Property::public_fields() + [property_ownerships: (PropertyOwnership.public_fields() + [:id]), units: Unit.public_fields()])
      pp = translate_params(pp, :property_ownerships)
      pp = translate_params(pp, :units)

      return pp
    else
      return {}
    end
  end
end