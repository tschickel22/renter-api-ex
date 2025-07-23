class Api::VendorInsurancesController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_declarations]

  def model_class
    VendorInsurance
  end

  def primary_key_field
    :id
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
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: VendorInsurance.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:declaration])
      unattached_file_batch.save

      declarations = unattached_file_batch.files.collect{|ip| VendorInsurance.declaration_builder(ip).attributes!}
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
        render_json({errors: ["Vendor Insurance not found"]}, false)
      end
    end
  end
  protected

  def render_declarations_json
    declarations = @object.declarations.collect{|ip| VendorInsurance.declaration_builder(ip).attributes!} if @object.present?
    render_json({ declarations: declarations  })
  end
end