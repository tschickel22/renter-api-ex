module LeasesHelper

  def lease_resident_resident_shell
    lease_resident_shell = Resident.public_fields_with_date_of_birth() + [:screening_agreement, :last_update_from_app_at]
    lease_resident_shell << {resident_pets: [ResidentPet.public_fields()]}
    lease_resident_shell << {resident_residence_histories: [ResidentResidenceHistory.public_fields()]}
    lease_resident_shell << {resident_employment_histories: [ResidentEmploymentHistory.public_fields()]}
    lease_resident_shell << {resident_contact_emergencies: [ResidentContact.public_fields()]}
    lease_resident_shell << {resident_contact_references: [ResidentContact.public_fields()]}
    lease_resident_shell << {resident_vehicles: [ResidentVehicle.public_fields()]}

    return lease_resident_shell
  end

  def handle_lease_resident(permitted_params)

    # Transform the param names to add "_attributes" and set some values linking the resident to the property
    new_lease_resident_attributes = {id: permitted_params[:id]}
    new_lease_resident_attributes[:current_step] = permitted_params[:current_step] if !permitted_params[:current_step].blank?

    if permitted_params[:lead_info]
      new_lease_resident_attributes[:lead_info_attributes] = permitted_params.delete(:lead_info)

      # This can be called from the unit listings page
      if current_user.present?
        new_lease_resident_attributes[:lead_info_attributes][:company_id] = current_user.company_id
      else
        new_lease_resident_attributes[:lead_info_attributes][:company_id] = params[:lease][:company_id]
      end
    end

    if permitted_params[:application_agreement]
      permitted_params.delete(:application_agreement)
      if @object.application_agreement_at.nil?
        new_lease_resident_attributes[:application_agreement_at] = Time.now
        new_lease_resident_attributes[:application_agreement_ip_address] = request.remote_ip
      end
    end

    if permitted_params[:resident]
      new_lease_resident_attributes[:resident_attributes] = permitted_params[:resident]
      new_lease_resident_attributes[:resident_attributes] = parse_number_param(new_lease_resident_attributes[:resident_attributes], [:income]) if !new_lease_resident_attributes[:resident_attributes][:income].blank?

      if !new_lease_resident_attributes[:resident_attributes][:date_of_birth].blank?
        new_lease_resident_attributes[:resident_attributes] = parse_mmddyy_param(new_lease_resident_attributes[:resident_attributes], [:date_of_birth])
      else
        new_lease_resident_attributes[:resident_attributes].delete(:date_of_birth)
      end

      new_lease_resident_attributes[:resident_attributes][:lease_resident_type] = permitted_params[:type] # For validation only
      new_lease_resident_attributes[:resident_attributes][:lease_resident_step] = permitted_params[:current_step]
      new_lease_resident_attributes[:resident_attributes][:last_update_from_app_at] = Time.now

      if new_lease_resident_attributes[:resident_attributes][:screening_agreement] && @object.resident.screening_agreement_at.nil?
        new_lease_resident_attributes[:resident_attributes][:screening_agreement_at] = Time.now
        new_lease_resident_attributes[:resident_attributes][:screening_agreement_ip_address] = request.remote_ip
      else
        new_lease_resident_attributes[:resident_attributes].delete(:screening_agreement_at)
      end

      new_lease_resident_attributes[:resident_attributes][:resident_pets_attributes] = permitted_params[:resident].delete(:resident_pets) || []
      new_lease_resident_attributes[:resident_attributes][:resident_residence_histories_attributes] = remove_empty(permitted_params[:resident].delete(:resident_residence_histories) || [], ResidentResidenceHistory.form_fields, :application_include_resident_histories)
      new_lease_resident_attributes[:resident_attributes][:resident_employment_histories_attributes] = remove_empty(permitted_params[:resident].delete(:resident_employment_histories) || [], ResidentEmploymentHistory.form_fields, :application_include_employment_histories)
      new_lease_resident_attributes[:resident_attributes][:resident_contact_emergencies_attributes] = remove_empty(permitted_params[:resident].delete(:resident_contact_emergencies) || [], ResidentContact.form_fields, :application_include_emergency_contacts)
      new_lease_resident_attributes[:resident_attributes][:resident_contact_references_attributes] = remove_empty(permitted_params[:resident].delete(:resident_contact_references) || [], ResidentContact.form_fields, :application_include_references)
      new_lease_resident_attributes[:resident_attributes][:resident_vehicles_attributes] = permitted_params[:resident].delete(:resident_vehicles) || []

      # Parse monthly rent if necessary
      new_lease_resident_attributes[:resident_attributes][:resident_residence_histories_attributes].each_with_index do | rrha, index |
        new_lease_resident_attributes[:resident_attributes][:resident_residence_histories_attributes][index] = parse_number_param(rrha, [:monthly_rent]) if !rrha[:monthly_rent].blank?
      end

      permitted_params.delete(:resident)
    end

    permitted_params = permitted_params.merge(new_lease_resident_attributes)

    return permitted_params
  end

  # Lease Residents require some special handling to ensure statuses, types and ids are all set properly
  def handle_lease_residents(permitted_params)

    permitted_params = handle_other_lease_resident_type(permitted_params, :secondary_residents, LeaseResidentSecondary.to_s)
    permitted_params = handle_other_lease_resident_type(permitted_params, :minors, LeaseResidentMinor.to_s)
    permitted_params = handle_other_lease_resident_type(permitted_params, :occupants, LeaseResidentOccupant.to_s)
    permitted_params = handle_other_lease_resident_type(permitted_params, :guarantors, LeaseResidentGuarantor.to_s)

    return permitted_params

  end

  def handle_other_lease_resident_type(permitted_params, type, class_name)
    if permitted_params[type]
      new_residents_attributes = []

      permitted_params[type].each do | lease_resident |
        new_resident_attributes = {id: lease_resident[:id], lease_id: @object.id}

        new_resident_attributes[:updated_at] = Time.now # Trigger validation

        if !lease_resident[:current_step].blank?
          new_resident_attributes[:current_step] = lease_resident[:current_step]
        end

        if lease_resident[:resident].present?
          new_resident_attributes[:resident_attributes] = lease_resident.delete(:resident)
          new_resident_attributes[:resident_attributes][:lease_resident_type] = class_name  # For validation only
          new_resident_attributes[:resident_attributes][:lease_resident_step] = lease_resident[:current_step]
        end

        if !permitted_params[:screening_package_id].blank?
          new_resident_attributes[:screening_package_id] = permitted_params[:screening_package_id]
        end

        new_residents_attributes << lease_resident.merge(new_resident_attributes)
      end

      permitted_params.delete(type)
      permitted_params["#{type}_attributes".to_sym] = new_residents_attributes
    end

    return permitted_params
  end

  # If an object isn't required, don't try to save an empty one
  def remove_empty(param_array, fields_to_check, settings_field)
    if !param_array.empty? && @current_settings.present? && @current_settings[settings_field] != Setting::REQUIRED
      new_param_array = Array.new
      param_array.each do | params |
        is_object_empty = true
        fields_to_check.each do | field |
          is_object_empty &&= params[field].blank?
        end

        params[:optional_by_setting] = true

        new_param_array << params if !is_object_empty
      end

      return new_param_array
    else
      return param_array
    end
  end
end