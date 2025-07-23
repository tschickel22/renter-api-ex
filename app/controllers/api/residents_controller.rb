class Api::ResidentsController < Api::ApiController
  before_action :set_resident, only: [:upload_income_proofs, :destroy_income_proof, :income_proofs]
  skip_before_action :verify_authenticity_token, only: [:upload_income_proofs, :upload, :upload_identification_selfie, :upload_identification_copy]

  def model_class
    Resident
  end

  def show
    if params[:id] == "my"
      render_json({ resident: current_user.resident })
    else
      super
    end
  end

  def primary_key_field
    :hash_id
  end

  def credit_reporting_activities
    load_object_for_update()

    credit_reporting_breakdown = {}
    visible_credit_reporting_activities = @object.credit_reporting_activities.where(["reported_on >= :credit_builder_start_on", credit_builder_start_on: @object.credit_builder_start_on])
    months_reported = visible_credit_reporting_activities.count

    if months_reported > 0
      last_report = visible_credit_reporting_activities.first # These are ordered most recent to oldest
      amount_reported = last_report.amount_reported
      reported_on = last_report.reported_on

      visible_credit_reporting_activities.each do | cra |
        year = cra.reported_on.year
        month = cra.reported_on.strftime('%b').downcase

        row = credit_reporting_breakdown[year] || {year: year}

        row[month] = [(row[month] || 0), cra.amount_reported].max

        credit_reporting_breakdown[year] = row
      end
    end

    render_json({credit_reporting_breakdown: credit_reporting_breakdown.values,  summary: {months_reported: months_reported, last_amount_reported: amount_reported, last_reported_on: reported_on}})
  end

  def income_proofs
    render_income_proofs_json()
  end

  def destroy_income_proof
    @resident.income_proofs.where(id: params[:income_proof_id]).purge
    render_income_proofs_json()
  end

  def upload_income_proofs
    if @resident.present?
      @resident.income_proofs.attach(params.permit(:income_proof)[:income_proof])

      if @resident.save
        render_income_proofs_json()
      else
        render_json({errors: extract_errors_by_attribute(@resident)}, false)
      end
    else
      render_json({errors: ["Resident not found"]}, false)
    end
  end

  def upload
    # Save uploaded spreadsheet (good for debugging)
    name = params[:residents_upload].original_filename
    dir = File.join("uploads", "#{current_user.company_id}", "residents")
    FileUtils.makedirs( dir ) if !Dir.exists?(dir)
    path = File.join(dir, name)
    File.open(path, "wb") { |f| f.write(params[:residents_upload].read) }

    import_results = ResidentService.import_from_spreadsheet(current_user.company, path)
    results = Hash.new

    import_results.each_with_index do | row, index |
      results[index + 2] = row
    end

    render_json({results: results}, true)

  end


  def identification_selfie
    load_object_for_update()
    render_attachment_json(:identification_selfie, @object.identification_selfie)
  end

  def destroy_identification_selfie
    load_object_for_update()
    @object.identification_selfie.purge
    render_attachment_json(:identification_selfie, nil)
  end

  def upload_identification_selfie

    load_object_for_update()

    if @object.present?
      @object.identification_selfie.attach(params.permit(:identification_selfie)[:identification_selfie])

      if @object.save
        render_attachment_json(:identification_selfie, @object.identification_selfie)
      else
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      render_json({errors: ["Lease resident not found"]}, false)
    end
  end

  def identification_copy
    load_object_for_update()
    render_attachment_json(:identification_copy, @object.identification_copy)
  end

  def destroy_identification_copy
    load_object_for_update()
    @object.identification_copy.purge
    render_attachment_json(:identification_copy, nil)
  end

  def upload_identification_copy

    load_object_for_update()

    if @object.present?
      @object.identification_copy.attach(params.permit(:identification_copy)[:identification_copy])

      if @object.save
        render_attachment_json(:identification_copy, @object.identification_copy)
      else
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      render_json({errors: ["Lease resident not found"]}, false)
    end
  end

  protected

  def object_params
    params.require(:resident).permit(Resident.public_fields_with_date_of_birth)
  end

  def set_resident
    @resident = Resident.for_user(current_user).where(hash_id: params[:id]).first
  end

  def render_income_proofs_json
    income_proofs = @resident.income_proofs.collect{|ip| Resident.income_proof_builder(ip).attributes!}
    render_json({ income_proofs: income_proofs  })
  end

end