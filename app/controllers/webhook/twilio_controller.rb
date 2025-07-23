class Webhook::TwilioController < ApplicationController

  skip_before_action :verify_authenticity_token
  before_action :find_residents
  before_action :store_inbound_message
  rescue_from Exception, with: :command_not_found

  def create
    send(params[:Body].downcase.strip)
  end

  private

  def info ; help ; end
  def cancel ; stop ; end
  def end ; stop ; end
  def quit ; stop ; end
  def unsubscribe ; stop ; end

  def help
    body = "Renter Insight: Help is available at support@renterinsight.com. Msg & data rates may apply. Message frequency varies. Reply STOP to stop."

    twiml = Twilio::TwiML::MessagingResponse.new do |resp|
      resp.message body: body
    end

    render xml: twiml.to_s
  end

  def subscribe
    update_residents
  end

  def stop
    update_residents "opt_out"
  end

  def update_residents(opt_in_type="opt_in")
    body = "You are now subscribed to Renter Insight Alerts. Help is available at support@renterinsight.com. Msg & data rates may apply. Message frequency varies. Reply STOP to stop."
    text_opted_out_at = nil

    if opt_in_type == 'opt_out'
      body = "You are unsubscribed from Renter Insight Alerts. No more messages will be sent. Reply HELP for help or email support@renterinsight.com"
      text_opted_out_at = Time.now
    end

    if @residents.count
      @residents.each do |resident|
        resident.update({
          text_opted_out_at: text_opted_out_at
        })
      end
    else
      body = "The number #{params[:From]} could not be found. Please contact customer service at support@renterinsight.com"
    end

    twiml = Twilio::TwiML::MessagingResponse.new do |resp|
      resp.message body: body
    end

    render xml: twiml.to_s
  end

  def find_residents
    @residents = ProcessInboundText.find_residents(params[:From])
  end

  def store_inbound_message
    # If it has fallen here, the message is simply a reply
    ProcessInboundText.enqueue(params.to_json)
  end

  def command_not_found

  end

end
