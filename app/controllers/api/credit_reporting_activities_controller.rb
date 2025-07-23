class Api::CreditReportingActivitiesController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_property_list]

  def model_class
    CreditReportingActivity
  end

  def upload_property_list
    if params[:credit_builder_upload].present?
      # Save uploaded spreadsheet (good for debugging)
      name = params[:credit_builder_upload].original_filename
      dir = File.join("uploads", Date.today.strftime('%Y%m'))
      FileUtils.makedirs( dir ) if !Dir.exists?(dir)
      path = File.join(dir, name)
      File.open(path, "wb") { |f| f.write(params[:credit_builder_upload].read) }

      xlsx = Roo::Spreadsheet.open(path)

      # Find the header
      headers = nil
      properties_updated = 0
      xlsx.sheet(xlsx.default_sheet).each(expected_columns) do | row |
        if headers.nil?
          headers = row
        else
          property_id = row[:combo_id].slice(8,8).to_i

          property = Property.where(id: property_id).first

          if property.present? && !row[:reporting_code].blank? && (property.external_credit_builder_id || "") != row[:reporting_code]
            property.external_credit_builder_id = row[:reporting_code]
            property.save(validation: false)
            properties_updated += 1
          end
        end
      end

      render_json({message: "#{properties_updated} #{"property".pluralize(properties_updated)} saved"}, true)
    else
      render_json({errors: ["No file provided"]}, false)
    end
  end

  protected

  def object_params
    params.require(:credit_reporting_activity).permit(CreditReportingActivity.public_fields)
  end

  def expected_columns
    {
      property_company_name: "Property Company Name",
      property_name: "Long name to Display",
      property_name_short: "Short name Display",
      street: "Servicer's Dispute address",
      city: "Servicer's Dispute City",
      state: "Servicer's Dispute State",
      zip: "Servicer's Dispute Zip code",
      phone: "Servicer's Dispute Phone #",
      combo_id: "Identification number",
      reporting_code: "Reporting Code"
    }
  end
end