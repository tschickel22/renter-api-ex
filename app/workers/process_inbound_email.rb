include WorkerHelper

class ProcessInboundEmail

  def self.enqueue(data)
    Resque.enqueue_to("process_inbound_email", self, data)
  end

  def self.perform(data)

    log "ProcessInboundEmail Checking mailbox at #{Time.now}..."
    message_body = JSON.parse(data["Message"])
    message = Mail.new(Base64.decode64(message_body["content"]))

    # Route this to the appropriate handler
    to_email = CommunicationLog.read_to_address(message)

    if to_email.include?(RenterInsightDwellsyApi.new.generate_notification_email_address())
      ParseLeadEmail.perform(message, RenterInsightDwellsyApi::API_PARTNER_ID)
    elsif to_email.include?(RenterInsightRentApi.new.generate_notification_email_address())
      ParseLeadEmail.perform(message, RenterInsightRentApi::API_PARTNER_ID)
    elsif to_email.include?(RenterInsightRentalSourceApi.new.generate_notification_email_address())
      ParseLeadEmail.perform(message, RenterInsightRentalSourceApi::API_PARTNER_ID)
    elsif to_email.include?(RenterInsightZillowApi.new.generate_notification_email_address())
      ParseLeadEmail.perform(message, RenterInsightZillowApi::API_PARTNER_ID)
    elsif to_email.include?(RenterInsightZumperApi.new.generate_notification_email_address())
      ParseLeadEmail.perform(message, RenterInsightZumperApi::API_PARTNER_ID)
    else
      CommunicationLog.store_inbound_email(message)
    end

    log "ProcessInboundEmail Messages Processed: 1"

  end

end
