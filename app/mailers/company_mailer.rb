class CompanyMailer < ApplicationMailer
  include ActionView::Helpers::NumberHelper

  default from: "Renter Insight <#{Rails.application.credentials.dig(:imap, :email)}>"
  default reply_to: Rails.application.credentials.dig(:imap, :email)
  default bcc: Rails.application.credentials.dig(:smtp, :bcc)

  def self.email_config
    {
      screening_complete: { user_role_email_type: UserRole::EMAIL_TYPE_SCREENING, reply_to: 'lease_resident', subject: "Renter Insight: Screening Complete for {resident.full_name}", description: 'Sent to company when report delivery is complete'},
      screening_skipped: {  user_role_email_type: UserRole::EMAIL_TYPE_SCREENING, reply_to: 'lease_resident', subject: "Renter Insight: Application Complete for {resident.full_name}", description: 'Sent to company when renter screening is skipped due to no SSN'},
      application_complete: {  user_role_email_type: UserRole::EMAIL_TYPE_SCREENING, reply_to: 'lease_resident', subject: "Renter Insight: Application Complete for {resident.full_name}", description: 'Sent to company when application is complete because no screening was required'},
      identity_verification_failed: {  user_role_email_type: UserRole::EMAIL_TYPE_SCREENING, reply_to: 'lease_resident', subject: "Renter Insight: {resident.full_name} Failed IDV", description: 'Sent to company if renter IDV fails'},
      onboarding_payments_submitted: {  user_role_email_type: UserRole::EMAIL_TYPE_ALL_COMPANY_ADMINS, reply_to: "Electronic Payment Application Submitted", description: 'Sent as confirmation that we received their payments onboarding application'},
      onboarding_payments_completed: {  user_role_email_type: UserRole::EMAIL_TYPE_ALL_COMPANY_ADMINS, reply_to: "Electronic Payments Activated", description: 'Sent when payments onboarding is complete'},
      payment_receipt: { user_role_email_type: UserRole::EMAIL_TYPE_PAYMENTS, reply_to: 'lease_resident', subject: "Renter Insight: {payment.amount} Received at {payment.lease.property.name}", description: 'Any time an electronic payment is received, we notify the company'},
      renter_requesting_access: {  user_role_email_type: UserRole::EMAIL_TYPE_LEASING, reply_to: 'lease_resident', subject: "Renter Insight: {resident.full_name} is Requesting Portal Access", description: 'Sent when a renter asks for a move-in date so that they can access the portal'},
      lead_added: {  user_role_email_type: UserRole::EMAIL_TYPE_LEASING, reply_to: 'lease_resident', subject: "Renter Insight: New Lead for {property.name}", description: 'Sent when a renter posts a comment from a listing'},
      renter_requesting_electronic_payments: { user_role_email_type: UserRole::EMAIL_TYPE_PAYMENTS, reply_to: 'lease_resident', subject: "Renter Insight: {resident.full_name} is Requesting Online Rent Payments", description: 'Triggered by the renter when they want to use online payments but it is not yet active'},
      renter_submitted_maintenance_request: {user_role_email_type: UserRole::EMAIL_TYPE_MAINTENANCE_REQUESTS, reply_to: 'maintenance_request:comments', subject: "Renter Insight: {maintenance_request.submitted_by.name} created a maintenance request", description: "A Resident Created a New Maintenance Ticket"},
      maintenance_request_assigned: { user_role_email_type: UserRole::EMAIL_TYPE_MAINTENANCE_REQUESTS, reply_to: 'maintenance_request:internal_notes', subject: "Renter Insight: Maintenance Request Assigned for {property.name}", description: "Confirmation for New Maintenance Ticket assigned to Vendor"},
      maintenance_request_vendor_completed_work: {user_role_email_type: UserRole::EMAIL_TYPE_MAINTENANCE_REQUESTS, reply_to: 'maintenance_request:internal_notes', subject: "Renter Insight: {vendor.name} has completed work on Ticket {maintenance_request.id}", description: "A 3rd party vendor completed work on a ticket."},
      maintenance_request_comment_added: {user_role_email_type: UserRole::EMAIL_TYPE_MAINTENANCE_REQUESTS, reply_to: 'maintenance_request:comments', subject: "Re: {maintenance_request.title}", description: "Maintenance Ticket Reply"},
      maintenance_request_closed: {user_role_email_type: UserRole::EMAIL_TYPE_MAINTENANCE_REQUESTS, reply_to: 'maintenance_request:comments', subject: "Ticket Closed: {maintenance_request.title}", description: "Maintenance Ticket Closed"},
      communication_center_comment_added: {user_role_email_type: UserRole::EMAIL_TYPE_COMMUNICATIONS, reply_to: 'communication_center:comments', subject: "Message Added", description: "Communication Reply"},
      renter_requesting_move_out: { user_role_email_type: UserRole::EMAIL_TYPE_LEASING, reply_to: 'lease_resident', subject: "{resident.full_name} submitted their notice to move-out", description: 'A Resident Submits a Move-out Request'},
      renter_requesting_renewal: { user_role_email_type: UserRole::EMAIL_TYPE_LEASING, reply_to: 'lease_resident', subject: "{resident.full_name} submitted a request to renew their Lease", description: 'A Resident Submits a Request to Renew Lease'},
      lease_expiring_soon: { user_role_email_type: UserRole::EMAIL_TYPE_LEASING, reply_to: 'lease_resident', subject: "Renter Insight: Lease Expiring for {lease.unit_street_and_unit}", description: 'A lease is expiring in 60 days'},
      welcome_new_user: { user_role_email_type: "N/A", subject: "Renter Insight Property Software User Created", description: 'A user account is added for a company admin or user'},
    }
  end

  def self.send_to_appropriate_users(mailer_method, property_or_company, *args)
    # property_or_company can be a Property or a Company depending on the type of email
    company = property_or_company.is_a?(Property) ? property_or_company.company : property_or_company
    property_id = property_or_company.is_a?(Property) ? property_or_company.id : nil

    # Send emails to all company admins
    User.where(company_id: company.id).each do | user |
      if CompanyMailer.should_send_to_user(user, property_id, mailer_method)
        Rails.logger.info("CompanyMailer: Sending #{mailer_method} to #{user.email}")
        Resque.enqueue_to("background_mailer", CompanyMailer, mailer_method, args + [user.id])
      else
        Rails.logger.info("CompanyMailer: SKIPPING #{mailer_method} to #{user.email}")
      end
    end
  end

  def screening_complete(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: Screening Complete for #{@resident.full_name}", to: @user.email) do |format|
      format.html
    end
  end

  def screening_skipped(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: Application Complete for #{@resident.full_name}", to: @user.email) do |format|
      format.html
    end
  end

  def application_complete(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: Application Complete for #{@resident.full_name}", to: @user.email) do |format|
      format.html
    end
  end

  def identity_verification_failed(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@resident.full_name} Failed IDV", to: @user.email) do |format|
      format.html
    end
  end

  def onboarding_payments_submitted(company_id, user_id)
    @user = User.find(user_id)
    @company = Company.find(company_id)

    # Send emails to all company admins
    log_and_mail(subject: "Electronic Payment Application Submitted", to: @user.email) do |format|
      format.html
    end
  end

  def onboarding_payments_completed(company_id, user_id)
    @user = User.find(user_id)
    @company = Company.find(company_id)

    log_and_mail(subject: "Electronic Payments Activated", to: @user.email) do |format|
      format.html
    end
  end

  def payment_receipt(payment_id, user_id)
    @user = User.find(user_id)
    @payment = ResidentPayment.find(payment_id)
    @resident = @payment.resident
    @company = @payment.company
    @lease_resident = LeaseResident.where(resident_id: @payment.resident_id, lease_id: @payment.lease_id).first

    log_and_mail(subject: "Renter Insight: #{number_to_currency(@payment.amount)} Received at #{@payment.lease.property.name}", to: @user.email) do |format|
      format.html
    end
  end

  def renter_requesting_access(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@resident.full_name} is Requesting Portal Access", to: @user.email) do |format|
      format.html
    end
  end

  def lead_added(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: New Lead for #{@lease.property.name}", to: @user.email) do |format|
      format.html
    end
  end

  def renter_requesting_electronic_payments(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@resident.full_name} is Requesting Online Rent Payments", to: @user.email) do |format|
      format.html
    end
  end

  def renter_submitted_maintenance_request(maintenance_request_id, user_id)
    @user = User.find(user_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @company = @maintenance_request.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@maintenance_request.submitted_by.name} created a maintenance request", to: @user.email) do |format|
      format.html
    end
  end

  def maintenance_request_assigned(maintenance_request_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @company = @maintenance_request.company

    if @maintenance_request.assigned_to.is_a?(User)
      @user = @maintenance_request.assigned_to
    else
      @user = nil
    end

    log_and_mail(subject: "Renter Insight: Maintenance Request Assigned for #{@maintenance_request.property.name}", to: @maintenance_request.assigned_to.email)
  end

  def maintenance_request_vendor_completed_work(maintenance_request_id, user_id)
    @user = User.find(user_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @company = @maintenance_request.company
    @vendor = @maintenance_request.assigned_to

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@vendor&.name} has completed work on Ticket ##{@maintenance_request.id}", to: @user.email) do |format|
      format.html
    end
  end

  def maintenance_request_comment_added(maintenance_request_id, communication_id, user_id)
    @user = User.find(user_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @communication = CommunicationNotePublic.find(communication_id)
    @company = @maintenance_request.company

    # Send emails to all company admins
    log_and_mail(subject: "Re: #{@maintenance_request.title}", to: @user.email) do |format|
      format.html
    end
  end

  def maintenance_request_closed(maintenance_request_id, user_id)
    @user = User.find(user_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @company = @maintenance_request.company

    # Send emails to all company admins
    log_and_mail(subject: "Ticket Closed: #{@maintenance_request.title}", to: @user.email) do |format|
      format.html
    end
  end

  def communication_center_comment_added(communication_id, user_id)
    @user = User.find(user_id)
    @communication = CommunicationNotePublic.find(communication_id)
    @resident = @communication.resident
    @company = @communication.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: Message Added", to: @user.email) do |format|
      format.html
    end
  end

  def renter_requesting_move_out(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@resident.full_name} submitted their notice to move-out", to: @user.email) do |format|
      format.html
    end
  end

  def renter_requesting_renewal(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: #{@resident.full_name} submitted a request to renew their lease", to: @user.email) do |format|
      format.html
    end
  end

  def lease_expiring_soon(lease_resident_id, user_id)
    @user = User.find(user_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident
    @company = @lease.company

    # Send emails to all company admins
    log_and_mail(subject: "Renter Insight: Lease Expiring for #{@lease.unit.street_and_unit}", to: @user.email) do |format|
      format.html
    end
  end

  def welcome_new_user(user_id)
    @user = User.find(user_id)
    @token = @user.update_reset_password_token
    @user.save

    log_and_mail(subject: "Renter Insight Property Software User Created", to: @user.email) do | format |
      format.html
    end

    CompanyTexter.new.welcome_new_user(user_id, @token)
  end


  protected

  def log_and_mail(headers = {}, &block)

    headers[:reply_to] = "Renter Insight<#{build_reply_to_address(CompanyMailer.email_config)}>"

    email_result = mail(headers, &block)

    if !defined?(@skip_logging)

      communication_exists = defined?(@communication) && @communication.present?

      if !communication_exists
        @communication = CommunicationEmail.new

        if defined?(@user) && @user.present?
          @communication.company_id = @user.company_id
          @communication.to = @user
        end

        if defined?(@maintenance_request) && @maintenance_request.present?
          @communication.property_id = @maintenance_request.property_id
          @communication.related_object = @maintenance_request
        elsif defined?(@payment_return) && @payment_return.present?
          @communication.related_object = @payment_return
        elsif defined?(@payment) && @payment.present?
          @communication.related_object = @payment
        elsif defined?(@charge) && @charge.present?
          @communication.related_object = @charge
        end

        @communication.from_id = 1
        @communication.from_type = Company.to_s
        @communication.sub_type = "#{self.class.to_s}.#{action_name}"
      end

      @communication.email_result = email_result
      @communication.log_raw_email
      # DO WE NEED THIS @communication.communication_logs.save


      @communication.save
    end
  end

  def self.should_send_to_user(user, property_id, mailer_method)
    email_settings = CompanyMailer.email_config[mailer_method.to_sym]

    user_role_email_type = email_settings[:user_role_email_type] if email_settings.present?
    user_role_email_type ||= UserRole::EMAIL_TYPE_ALL_COMPANY_ADMINS

    is_all_company_admin = user_role_email_type == UserRole::EMAIL_TYPE_ALL_COMPANY_ADMINS && user.is_company_admin?
    is_user_with_role = user.user_role.present? && user.user_role["get_#{user_role_email_type}_email".to_sym]

    # Do we need to look at the property_id?
    if !user.is_company_admin? && is_user_with_role
      is_user_with_role &&= property_id.present? && user.property_ids.include?(property_id)
    end

    return is_all_company_admin || is_user_with_role || false

  end
end