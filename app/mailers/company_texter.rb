class CompanyTexter < ApplicationTexter

  def self.text_config
    {
      confirmation_instructions: {description: 'A company has just signed up for Renter Insight and this is our way of confirming their validity.'},
      welcome_new_user: {description: 'A user account is added for a company admin or user'},
    }
  end

  def confirmation_instructions(user_id)
    @user = User.find(user_id)
    @company = @user.company

    body = "Thank you for creating an account with Renter Insight.  Please confirm your account using this link:\n\n#{ApplicationMailer.base_url}/users/confirmation?confirmation_token=#{@user.confirmation_token}"

    log_and_text(__method__, body)
  end

  def welcome_new_user(user_id, token)
    @user = User.find(user_id)
    @company = @user.company

    body = "#{@company.name} has invited you to access Renter Insight Property Management Software.  Please use this link to set your password:\n\n#{ApplicationMailer.base_url}/users/password/edit?reset_password_token=#{token}"

    log_and_text(__method__, body)
  end

  def maintenance_request_assigned(maintenance_request_id)
    @maintenance_request = MaintenanceRequest.find(maintenance_request_id)
    @company = @maintenance_request.company

    if @maintenance_request.assigned_to.is_a?(User)
      @user = @maintenance_request.assigned_to
    elsif @maintenance_request.assigned_to.is_a?(Vendor)
      @vendor = @maintenance_request.assigned_to
    end

    body = "#{@maintenance_request.submitted_by.name} has assigned you a maintenance request.  Please use this link to update the ticket with progress or questions:\n\n#{ApplicationMailer.base_url}/mr/#{@maintenance_request.hash_id}"

    log_and_text(__method__, body)
  end

  protected

  def log_and_text(action_name, body)

    if !defined?(@skip_logging)

      @communication = CommunicationNotePublic.new({body: body, sub_type: ""})

      if defined?(@user) && @user.present?
        @communication.company_id = @user.company_id
        @communication.to_id = @user.id
        @communication.to_type = User.to_s
        @communication.from_id = @company.id
        @communication.from_type = Company.to_s
      elsif defined?(@vendor) && @vendor.present?
        @communication.company_id = @company.id
        @communication.to_id = @vendor.id
        @communication.to_type = Vendor.to_s
        @communication.from_id = @company.id
        @communication.from_type = Company.to_s
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