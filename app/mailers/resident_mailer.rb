class ResidentMailer < ApplicationMailer

  default from: "Renter Insight <#{Rails.application.credentials.dig(:imap, :email)}>"
  default reply_to: Rails.application.credentials.dig(:imap, :email)
  default bcc: Rails.application.credentials.dig(:smtp, :bcc)

  def self.email_config
    {
      invitation: {reply_to: 'lease_resident', subject: 'Renter Insight: Invitation to Apply', description: "Sent from the company to a lead with a link to the application"},
      application_begin_confirmation: {reply_to: 'lease_resident', subject: 'Renter Insight: Begin Application', description: "Sent from the company to a lead who indicated they wanted to apply via a listing"},
      application_reopened: {reply_to: 'lease_resident', subject: 'Renter Insight: Application Reopened', description: "If a submitted application is reopened, the renter is notified this way"},
      identity_verification_failed: {reply_to: 'lease_resident', subject: "Renter Insight: Identity Verification Failed", description: "If IDV fails, we will send this to notify the renter of next steps"},
      manual_identity_verification_passed: {reply_to: 'lease_resident', subject: "Renter Insight: Identity Verification Passed", description: "If IDV is manually performed, we will send this to notify the renter of next steps"},
      payment_receipt: {reply_to: 'lease_resident', subject:  "Renter Insight: Payment for {payment.lease.unit.street_and_unit}", description: "The payment receipt for any electronic payment"},
      payment_return_receipt: {reply_to: 'lease_resident', subject: "Renter Insight: Payment for {payment.lease.unit.street_and_unit} Failed", description: "Notification that an ACH payment bounced/failed"},
      portal_access_granted: {reply_to: 'lease_resident', subject: "Renter Insight: Resident Portal Access for {lease.unit.street_and_unit}", description: "A resident is given full access to the resident portal."},
      maintenance_request_submitted: {reply_to: 'maintenance_request:comments', subject: "Renter Insight: Maintenance request submitted", description: "Confirmation for New Maintenance Ticket"},
      maintenance_request_assigned: {reply_to: 'maintenance_request:comments', subject: "Renter Insight: Maintenance request assigned", description: "Confirmation when a Maintenance Ticket gets assigned"},
      maintenance_request_submitted_by_property: {reply_to: 'maintenance_request:comments', subject: "Renter Insight: Maintenance request created", description: "Notification to Renter of New Maintenance Ticket Created by Property"},
      maintenance_request_comment_added: {reply_to: 'maintenance_request:comments', subject: "Re: {maintenance_request.title}", description: "Maintenance Ticket Reply"},
      maintenance_request_closed: {reply_to: 'maintenance_request:comments', subject: "Ticket Closed: {maintenance_request.title}", description: "Maintenance Ticket Closed"},
      communication_center_comment_added: {reply_to: 'communication_center:comments', subject: "Message Added", description: "Communication Reply"},
      charge_added: {reply_to: 'lease_resident', subject: '{charge_type} Charge for {charge.lease.unit.street_and_unit}', description: 'A property creates a resident charge and selects to send payment link to renter.'},
      rent_reminder: {reply_to: 'lease_resident', subject: 'Your Rent Due Reminder for {charge.lease.unit.street_and_unit}', description: "Sent when a resident's rent is due"},
      rent_due_today: {reply_to: 'lease_resident', subject: 'Your Rent Due Reminder for {charge.lease.unit.street_and_unit}', description: "Sent on the first of the month"},
      rent_due: {reply_to: 'lease_resident', subject: 'Your Rent is Late Reminder for {charge.lease.unit.street_and_unit}', description: "Sent when a resident's rent is due"},
      welcome_letter: {reply_to: 'lease_resident', subject: 'Congratulations on your new home at {charge.lease.unit.street_and_unit}', description: 'A property creates a move-in and checks to box to send welcome letter & payment link.'},
      renewal_notice: {reply_to: 'lease_resident', subject: 'Your Lease Has Been Renewed', description: "A property has renewed a resident's lease"},
      move_out_and_pay: {reply_to: 'lease_resident', subject: 'Final Move-Out Statement for {charge.lease.unit.street_and_unit}', description: "A property moves-out a resident and checks to box to send move-out letter & payment link."},
      move_out_and_refund: {reply_to: 'lease_resident', subject: 'Final Move-Out Statement for {charge.lease.unit.street_and_unit}', description: "A property moves-out a resident and has a security deposit refund due"},
      announcement: {reply_to: 'lease_resident', subject: '{announcement.subject}', description: "Delivery of an announcement"},
    }
  end

  def self.deliver_invitation_and_mark_as_sent(lease_resident)
    begin
      if ResidentMailer.invitation(lease_resident.id).deliver
        lease_resident.update({invitation_sent_at: Time.now})
        return true
      end
    rescue
      # What should we do here?  Drop it in Rescue?  We need to know when this happens
    end

    return false
  end

  def invitation(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    log_and_mail(subject: 'Renter Insight: Invitation to Apply', to: @resident.email) do |format|
      format.html
    end

    # Send the text too
    ResidentTexter.new.invitation(lease_resident_id)
  end

  def application_begin_confirmation(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    log_and_mail(subject: 'Renter Insight: Begin Application', to: @resident.email) do |format|
      format.html
    end
  end

  def application_reopened(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    log_and_mail(subject: 'Renter Insight: Application Reopened', to: @resident.email) do |format|
      format.html
    end
  end

  def identity_verification_failed(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    log_and_mail(subject: "Renter Insight: Identity Verification Failed",  to: @resident.email) do |format|
      format.html
    end
  end

  def manual_identity_verification_passed(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    log_and_mail(subject: "Renter Insight: Identity Verification Passed",  to: @resident.email) do |format|
      format.html
    end
  end

  def payment_receipt(payment_id)
    @payment = Payment.find(payment_id)
    @resident = @payment.resident
    @lease_resident = LeaseResident.where(resident_id: @payment.resident_id, lease_id: @payment.lease_id).first

    log_and_mail(subject: "Renter Insight: Payment for #{@payment.lease.unit.street_and_unit}",  to: @resident.email) do |format|
      format.html
    end
  end

  def payment_return_receipt(payment_return_id)
    @payment_return = PaymentReturn.find(payment_return_id)
    @payment = @payment_return.payment
    @company = @payment.company
    @resident = @payment.resident
    @lease_resident = LeaseResident.where(resident_id: @payment_return.resident_id, lease_id: @payment_return.lease_id).first
    @late_fee_charge = ResidentCharge.where(lease_id: @payment.lease_id, charge_type_id: ChargeType::LATE_FEE, due_on: PaymentService.todays_date()).first
    @nsf_fee_charge = ResidentCharge.where(lease_id: @payment.lease_id, charge_type_id: ChargeType::NSF_FEES, due_on: PaymentService.todays_date()).first

    # bcc any other users at the company with the proper permissions
    primary_company_admin_email = User.where(company_id: @company.id, user_type: User::TYPE_COMPANY_ADMIN).first.email
    other_company_user_emails = User.joins(:user_role).where(company_id: @company.id, user_role: {get_payments_email: true}).where.not(email: primary_company_admin_email).pluck(:email)

    log_and_mail(subject: "Renter Insight: Payment for #{@payment.lease.unit.street_and_unit} Failed", to: @resident.email, cc: primary_company_admin_email, bcc: other_company_user_emails) do |format|
      format.html
    end
  end

  def charge_added(charge_id)
    @charge = ResidentCharge.find(charge_id)
    @company = @charge.company
    @lease_resident =  @charge.lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "#{@charge.charge_type&.name} Charge for #{@charge.lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def rent_reminder(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Your Rent Due Reminder for #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def rent_due_today(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Your Rent Due Reminder for #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def rent_due(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Your Rent is Late Reminder for #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def welcome_letter(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Congratulations on your new home at #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def renewal_notice(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Your lease has been renewed at #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def move_out_and_pay(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Final Move-Out Statement for #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def move_out_and_refund(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    log_and_mail(subject: "Final Move-Out Statement for #{@lease.unit.street_and_unit}", to: @resident.email) do |format|
      format.html
    end
  end

  def portal_access_granted(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    log_and_mail(subject: "Renter Insight: Resident Portal Access for #{@lease.unit.street_and_unit}",  to: @resident.email) do |format|
      format.html
    end

    # Send the text too
    ResidentTexter.new.portal_access_granted(lease_resident_id)
  end

  def maintenance_request_submitted(maintenance_request_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @resident = @maintenance_request.resident
    @user = @maintenance_request.submitted_by

    log_and_mail(subject: 'Renter Insight: Maintenance request submitted', to: @resident.email) do |format|
      format.html
    end
  end

  def maintenance_request_submitted_by_property(maintenance_request_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @resident = @maintenance_request.resident
    @user = @maintenance_request.submitted_by

    log_and_mail(subject: 'Renter Insight: Maintenance request created', to: @resident.email) do |format|
      format.html
    end
  end

  def maintenance_request_assigned(maintenance_request_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @resident = @maintenance_request.resident
    @user = @maintenance_request.submitted_by

    if @resident.present?
      log_and_mail(subject: "Renter Insight: Your Maintenance Request as been Assigned", to: @resident.email) do |format|
        format.html
      end
    end
  end


  def maintenance_request_comment_added(maintenance_request_id, communication_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @communication = CommunicationNotePublic.find(communication_id)
    @resident = @communication.resident
    @company = @maintenance_request.company
    @user = nil

    log_and_mail(subject: "Re: #{@maintenance_request.title}", to: @resident.email) do |format|
      format.html
    end
  end

  def maintenance_request_closed(maintenance_request_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @company = @maintenance_request.company
    @resident = @maintenance_request.resident

    # Send emails to all company admins
    log_and_mail(subject: "Ticket Closed: #{@maintenance_request.title}", to: @resident.email) do |format|
      format.html
    end
  end

  def communication_center_comment_added(communication_id)
    @communication = CommunicationNotePublic.find(communication_id)
    @resident = @communication.resident
    @company = @communication.company
    @user = nil

    log_and_mail(subject: "Message Added", to: @resident.email) do |format|
      format.html
    end
  end

  def announcement(communication_id)
    @communication = CommunicationNotePublic.find(communication_id)
    @announcement = @communication.related_object
    @resident = @communication.resident
    @company = @communication.company
    @user = nil

    @announcement.attachments.each do | announcement_attachment |
      attachments["#{announcement_attachment.filename}"] = announcement_attachment.download
    end

    log_and_mail(subject: @announcement.subject, to: @resident.email) do |format|
      format.html
    end
  end

  protected

  def log_and_mail(headers = {}, &block)

    headers[:reply_to] =  build_reply_to_address(ResidentMailer.email_config)

    email_result = mail(headers, &block)

    if !defined?(@skip_logging)

      communication_exists = defined?(@communication) && @communication.present?

      if !communication_exists
        @communication = CommunicationEmail.new

        if defined?(@lease) && @lease.present?
          @communication.company_id = @lease.company_id
          @communication.property_id = @lease.property_id
          @communication.from_id = @lease.property_id
          @communication.from_type = Property.to_s
        elsif defined?(@company) && @company.present?
          @communication.company_id = @company.id
          @communication.from_id = @company.id
          @communication.from_type = Company.to_s
        end

        if defined?(@resident) && @resident.present?
          @communication.resident_id = @resident.id
          @communication.to = @resident
        end

        if defined?(@maintenance_request) && @maintenance_request.present?
          @communication.related_object = @maintenance_request
        elsif defined?(@payment_return) && @payment_return.present?
          @communication.related_object = @payment_return
        elsif defined?(@payment) && @payment.present?
          @communication.related_object = @payment
        elsif defined?(@charge) && @charge.present?
          @communication.related_object = @charge
        end

        @communication.sub_type = "#{self.class.to_s}.#{action_name}"
      end

      @communication.email_result = email_result
      @communication.log_raw_email
      # DO WE NEED THIS @communication.communication_log.save

      @communication.save


    end
  end
end