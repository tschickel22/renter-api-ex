class Webhook::ZegoController < ApplicationController

  skip_before_action :verify_authenticity_token

  def processed
    Rails.logger.error("Zego Processed: ")
    Rails.logger.error(params.permit!.to_json)

    HandlePaymentUpdate.enqueue(:processed, params.permit!.to_json)

    render plain: "Ok"
  end

  def canceled
    Rails.logger.error("Zego Canceled: ")
    Rails.logger.error(params.permit!.to_json)

    HandlePaymentUpdate.enqueue(:canceled, params.permit!.to_json)

    render plain: "Ok"
  end
end