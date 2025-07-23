class ResidentTexter < ApplicationTexter

  def self.text_config
    {
      invitation: {description: "Sent from the company to a lead with a link to the application"},
      welcome_letter: {description: 'A property creates a move-in and checks to box to send welcome letter & payment link.'},
      portal_access_granted: {description: "A resident is given full access to the resident portal."},
    }
  end

  def invitation(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    body = "#{@resident.first_name},\nPlease use this link to apply at #{@lease.unit.street_and_unit}:\n\n #{ApplicationMailer.base_url}/portal/invite/#{@lease_resident.hash_id}"

    log_and_text(__method__, body)
  end

  def welcome_letter(lease_id)
    @lease = Lease.find(lease_id)
    @company = @lease.company
    @lease_resident =  @lease.primary_resident
    @resident = @lease_resident.resident

    body = "#{@resident.first_name},\nWelcome to your new home at #{@lease.unit.street_and_unit}. Use this link to access our resident portal and pay any Security Deposit or Fees that are due:\n\n #{ApplicationMailer.base_url}/portal"

    log_and_text(__method__, body)
  end

  def portal_access_granted(lease_resident_id)
    @lease_resident = LeaseResident.find(lease_resident_id)
    @lease = @lease_resident.lease
    @resident = @lease_resident.resident

    body = "#{@resident.first_name},\n#{@lease.company.name} has invited you to the Renter Insight resident portal.  Please use this link to set your password:\n\n #{ApplicationMailer.base_url}/portal/invite/#{@lease_resident.hash_id}"

    log_and_text(__method__, body)
  end

  protected

  def log_and_text(action_name, body)

    if !defined?(@skip_logging)

      @communication = CommunicationNotePublic.new({body: body, sub_type: ""})

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

      @communication.mediums = [Communication::MEDIUM_TEXT]
      @communication.sub_type = "#{self.class.to_s}.#{action_name}"

      # If there's no phone number, don't bother
      if !@communication.to&.phone_number.blank?

        @communication.save

        begin
          RenterInsightTwilioApi.new.send_message(@communication)
        rescue
          # If we had a failure, don't persist @object
          @communication.destroy if @communication.present?
          raise $!
        end
      end
    end
  end
end