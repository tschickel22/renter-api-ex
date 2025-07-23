class Api::VendorLicensesController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_licenses]

  def model_class
    VendorLicense
  end

  def primary_key_field
    :id
  end

  def licenses
    load_object_for_update()
    render_licenses_json()
  end

  def destroy_license
    load_object_for_update()
    @object.licenses.where(id: params[:license_id]).purge
    render_licenses_json()
  end

  def upload_licenses
    file_params = params.permit(:id, :license, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: VendorLicense.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:license])
      unattached_file_batch.save

      licenses = unattached_file_batch.files.collect{|ip| VendorLicense.license_builder(ip).attributes!}
      render_json({ licenses: licenses  })
    else
      load_object_for_update()

      if @object.present?
        @object.licenses.attach(params.permit(:license)[:license])

        if @object.save(validate: false)
          render_licenses_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["Vendor Insurance not found"]}, false)
      end
    end
  end
  protected

  def render_licenses_json
    licenses = @object.licenses.collect{|ip| VendorLicense.license_builder(ip).attributes!} if @object.present?
    render_json({ licenses: licenses  })
  end
end