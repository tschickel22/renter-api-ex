class Api::LeaseResidentsController < Api::ApiController
  include LeasesHelper

  def model_class
    LeaseResident
  end

  def validate_during_save
    current_user.nil? || !current_user.is_company_admin_at_least?
  end

  def primary_key_field
    :hash_id
  end

  def setup_new_object()
    lease = Lease.where(hash_id: params[:lease_resident][:lease_hash_id]).first
    new_lease_resident = model_class().new(lease: lease, type: params[:lease_resident][:type])

    # Set screening package
    new_lease_resident.screening_package_id = lease.primary_resident.screening_package_id

    return new_lease_resident
  end

  def load_object_for_update
    super
    @current_settings = Setting.for_property(@object.lease.company_id,@object.lease.property_id)
    @object.resident.current_settings = @current_settings
  end

  def search
    lease_residents = base_query
    lease_residents = lease_residents.joins(:resident, :lease).where(["lease.hash_id like :search_text OR concat(residents.first_name, ' ', residents.last_name) like :search_text OR residents.email like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?
    lease_residents, total = page(lease_residents)
    render_json({ plural_object_key() => lease_residents.collect{|o| o.to_builder_with_user(current_user, params[:mode] == 'resident_list' ? "inverse_skinny" : "inverse").attributes! }, total: total  })
  end

  def show
    data = {}
    lease_resident = LeaseResident.for_user(current_user).joins(:lease).includes(:lease).where(primary_key_field() => params[:id]).first

    data[:lease_resident] = lease_resident.to_builder_with_user(current_user, "full").attributes!
    data[:lease] = lease_resident.lease.to_builder("full").attributes!

    render_json(data)
  end

  def destroy
    begin
      load_object_for_update()

      if @object.present?

        # Are there any actual residents left if we delete this one?
        if @object.is_a?(LeaseResidentPrimary)
          new_primary_resident = @object.lease.secondary_residents.first

          if new_primary_resident.nil?
            render_json({errors: {base: "You cannot remove the only remaining resident"}}, false)
            return
          end
        end

        if @object.destroy

          if new_primary_resident
            new_primary_resident.update(type: LeaseResidentPrimary)
          end

          render_json({}, true)

        else
          render_failed_update()
        end
      else
        render_json({errors: {base: "#{model_class().to_s.humanize} not found"}}, false)
      end
    rescue
      render_json({errors: {base: $!.message}}, false)
    end
  end

  def validation_questions
    @object = LeaseResident.where(primary_key_field() => params[:id]).first
    api = RenterInsightTransUnionApi.new(@object.lease.company)
    data = api.begin_screening_request_renter_validation(@object, request.remote_ip)

    if data && data[:verification_status] != RenterInsightTransUnionApi::VERIFICATION_STATUS_ERROR
      if data[:verification_status] == RenterInsightTransUnionApi::VERIFICATION_STATUS_VERIFIED
        # Update Statuses
        api.update_screening_request_residents_statuses(@object, request.remote_ip)

        render_successful_update()
      else

        # Did we get no questions back? If so, we need to mark this as failed
        if data[:verification_status] == RenterInsightTransUnionApi::VERIFICATION_STATUS_UNVERIFIED && data[:verification_exam].present? && (data[:verification_exam][:authenticationQuestions] || []).empty?
          data[:verification_status] = RenterInsightTransUnionApi::VERIFICATION_STATUS_NO_QUESTIONS

          ResidentMailer.identity_verification_failed(@object.id).deliver
          CompanyMailer.send_to_appropriate_users(:identity_verification_failed, @object.lease.property, @object.id)
        end

        render_json(data)
      end

    else
      if data[:errors].present?
        render_json({errors: {base: data[:errors].join(", ")}})
      else
        render_json({errors: {base: "Could not begin verification process"}}, false)
      end

    end
  end

  def validation_answers
    @object = LeaseResident.where(primary_key_field() => params[:id]).first
    @object.update_attribute(:verification_attempt_count, @object.verification_attempt_count + 1)

    api = RenterInsightTransUnionApi.new(@object.lease.company)
    data = api.perform_screening_request_renter_validation(@object, params[:exam_id], api.organize_answers(params[:answers]), request.remote_ip)

    if data && data["result"] == RenterInsightTransUnionApi::VERIFICATION_STATUS_PASSED
      # Now, gather payment if necessary
      api.update_screening_request_residents_statuses(@object, request.remote_ip)

      render_successful_update()
      return
    end

    #
    # Send email?
    #
    if @object.verification_attempt_count >= 99
      if @object.identity_verification_failed_at.nil?
        @object.update_attribute(:identity_verification_failed_at, Time.now)

        ResidentMailer.identity_verification_failed(@object.id).deliver
        CompanyMailer.send_to_appropriate_users(:identity_verification_failed, @object.lease.property, @object.id)
      end

      render_json({verification_attempt_count: @object.verification_attempt_count, errors: {base: "Could not complete verification process"}}, false)
    else
      render_json({verification_attempt_count: @object.verification_attempt_count, errors: {base: "Verification #{data["result"]}. Please try again."}}, false)
    end
  end

  def resend_email
    @object = LeaseResident.where(primary_key_field() => params[:id]).first

    if params[:email_type] == "invitation"
      @object.update({current_step: LeaseResident::STEP_INVITATION})
      ResidentMailer.invitation(@object.id).deliver

    elsif params[:email_type] == "portal_access_granted"
      @object.update({invitation_sent_at: Time.now}) if @object.invitation_sent_at.nil?
      ResidentMailer.portal_access_granted(@object.id).deliver

      # Also send to secondary residents
      @object.lease.secondary_residents.each do | secondary_resident |
        secondary_resident.update({invitation_sent_at: Time.now})
        ResidentMailer.portal_access_granted(secondary_resident.id).deliver
      end

    elsif params[:email_type] == "application_reopened"
      @object.current_step = LeaseResident::STEP_APPLICANT_DETAILS
      @object.application_completed_at = nil
      @object.external_screening_status = nil
      @object.screening_reopened_at = Time.now
      @object.save(validate: false)

      # Reset the no-tax id flag?
      @object.resident.update_attribute(:no_tax_id, false) if @object.resident.no_tax_id
      @object.lease.update_attribute(:application_status, Lease::APPLICATION_STATUS_IN_PROGRESS)

      ResidentMailer.application_reopened(@object.id).deliver
    end

    render_successful_update()
  end

  def request_reports
    @object = LeaseResident.where(primary_key_field() => params[:id]).first

    handle_report_request()

    render_successful_update()
  end

  def reports
    lease_resident = LeaseResident.includes(:lease).where(primary_key_field() => params[:id]).first
    lease_resident_report = lease_resident.lease_resident_reports.where(hash_id: params[:lease_resident_report_id], audience: LeaseResidentReport.audience_for_user(current_user)).first

    # Check for disclaimer need
    unit_zip = lease_resident.lease.unit.zip

    if !lease_resident_report.disclaimer_accepted
      report_disclaimer = ReportDisclaimer.where(report_type: lease_resident_report.report_type).where("JSON_CONTAINS(zip_codes, ?)", "\"#{unit_zip}\"").first
    end

    render_json({lease: lease_resident.lease.to_builder("partial").attributes!,  lease_resident: lease_resident, lease_resident_report: report_disclaimer.present? ? nil : lease_resident_report.to_builder("full").attributes!, report_disclaimer: report_disclaimer})
  end

  def accept_disclaimer
    lease_resident = LeaseResident.includes(:lease).where(primary_key_field() => params[:id]).first
    lease_resident_report = lease_resident.lease_resident_reports.where(hash_id: params[:lease_resident_report_id], audience: LeaseResidentReport.audience_for_user(current_user)).first
    lease_resident_report.update({disclaimer_accepted: true})

    render_json({disclaimer_accepted: true})
  end

  def handle_report_request
    api = RenterInsightTransUnionApi.new(@object.lease.company)

    # Update Statuses
    api.update_screening_request_residents_statuses(@object, request.remote_ip)

    # Now, request for reports
    report_generation_data = api.request_report_generation(@object, request.remote_ip)

    # Update Statuses
    api.update_screening_request_residents_statuses(@object, request.remote_ip)

    return report_generation_data
  end

  def request_full_access
    @object = LeaseResident.where(primary_key_field() => params[:id]).first

    # Send an email to the property reminding them to make a decision
    if @object.lease.status == Lease::STATUS_FUTURE
      CompanyMailer.send_to_appropriate_users(:renter_requesting_access, @object.lease.property, @object.id)
    end

    render_successful_update()
  end

  def request_electronic_payments
    @object = LeaseResident.where(primary_key_field() => params[:id]).first

    CompanyMailer.send_to_appropriate_users(:renter_requesting_electronic_payments, @object.lease.property, @object.id)

    render_successful_update()
  end

  def handle_after_create
    if @object.current_step == LeaseResident::STEP_INVITATION
      ResidentMailer.deliver_invitation_and_mark_as_sent(@object)
    end
  end

  def handle_after_update
    # Should we skip the screening process?
    if @object.current_step == LeaseResident::STEP_APPLICANT_DETAILS
      if @object.lease.property.screening_is_activated? && @object.resident.no_tax_id
        @object.update_attribute(:external_screening_status, RenterInsightTransUnionApi::SCREENING_STATUS_SCREENING_SKIPPED)
      end

    # Should we start the screening process?
    elsif @object.current_step == LeaseResident::STEP_SCREENING
      begin_screening_process()
    end

    # This allows us to trigger specific actions that occur within a given step of the process (like send an invitation after Applicant Details)
    if Lease::ACTION_INVITE_TO_SCREENING == params[:lease_action]
      @object.update_attribute(:current_step, LeaseResident::STEP_INVITATION)
      ResidentMailer.deliver_invitation_and_mark_as_sent(@object)
    end

    @object.evaluate_current_step()
  end

  def render_successful_update()
    render_json({singular_object_key() => @object.to_builder_with_user(current_user, "full").attributes!, lease: @object.lease.to_builder("partial").attributes!})
  end

  def raise_api_errors(api)
    if api.response_data.is_a?(Hash)
      if !api.response_data["errors"].blank?
        error_messages = (api.response_data["errors"] || []).collect{|e| e["message"]}

        raise error_messages.join(", ")
      else
        raise api.response_data["message"]
      end
    else
      raise "An unknown error occurred with TransUnion"
    end
  end

  protected

  def base_query()
    lease_residents = LeaseResident.for_user(current_user).joins(:lease).includes([:lease, :resident])

    lease_residents = lease_residents.where(property_id: params[:property_id]) if !params[:property_id].blank?

    if params[:mode] == "screenings"
      lease_residents = lease_residents.includes(:lead_info, :lease_resident_reports, :screening_package, :resident, lease: [ {primary_resident: :resident}, {secondary_residents: :resident}, {guarantors: :resident}, {minors: :resident}, :property, :unit])
      lease_residents = lease_residents.where.not(screening_package_id: nil)
    elsif params[:mode] == 'leads'
      lease_residents = lease_residents.includes(:lead_info, :lease_resident_reports, :screening_package, :resident, lease: [ {primary_resident: :resident}, {secondary_residents: :resident}, {guarantors: :resident}, {minors: :resident}, :property, :unit])
      lease_residents = lease_residents.where(current_step: LeaseResident::STEP_LEAD)
    end

    if params[:mode] == 'resident_list'
      lease_residents = lease_residents.includes(:lead_info, :lease_resident_reports, :screening_package, :resident, lease: [ {primary_resident: :resident}, {secondary_residents: :resident}, {guarantors: :resident}, {minors: :resident}, :property, :unit])
    else
      lease_residents = lease_residents.includes([:lease, :resident])
    end

    return lease_residents
  end

  def begin_screening_process
    # Submit the screening
    api = RenterInsightTransUnionApi.new(@object.lease.company)
    api.sync_resident(@object.resident, request.remote_ip)

    # Assuming that went well, continue
    if @object.resident.external_screening_id.present?
      screening_request = @object.screening_request

      if screening_request.nil?
        screening_request = ScreeningRequest.create(external_bundle_id: @object.screening_package.present? ? @object.screening_package.external_screening_id : "2", company_id: @object.lease.company_id, property_id: @object.lease.property_id, lease_id: @object.lease.id, lease_resident_id: @object.id)

        if @object.lease.screening_payment_responsibility == "property"
          ChargeCompanyForScreening.enqueue(@object.id)
        end
      end

      @object.lease.reload

      # Do we need to generate a screening request at TU?
      if screening_request.external_screening_id.blank?
        api.create_screening_request(screening_request, request.remote_ip)
      end

      if !screening_request.external_screening_id.blank?
        # Now, add this resident
        if @object.external_screening_id.blank?
          api.add_resident_to_screening_request(screening_request, @object, request.remote_ip)
        end
      else
        raise_api_errors(api)
      end
    else
      raise_api_errors(api)
    end
  end

  def object_params
    if params.present?
      pp = params.require(:lease_resident).permit(LeaseResident.public_fields() + [{resident: lease_resident_resident_shell()}, :application_agreement])

      pp = handle_lease_resident(pp)
      pp.delete(:id)

      Rails.logger.error("\n\nLEASE RESIDENT PARAMS: #{pp.to_json}\n\n")

      return pp
    else
      return {}
    end
  end
end