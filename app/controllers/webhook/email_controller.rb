class Webhook::EmailController < ApplicationController
  protect_from_forgery with: :null_session

  rescue_from Exception, :with => :render_error_json

  def create
    body = request.body.read
    Rails.logger.error("Email Webhook START ---\n#{body}\n---END")
    data = JSON.parse(body)

    ProcessInboundEmail.enqueue(data)

    render json: {success: true}
  end

  def catch_all
    body = request.body.read
    Rails.logger.error("Email CatchALL START ---\n\n#{body}\n\n---END")
    render json: {success: true}
  end

  def render_error_json(exception = nil)
    if exception.present?
      msg = exception.message
      Rails.logger.error("EmailController.render_error_json: #{msg}\n#{exception.backtrace.join("\n")}")
    else
      msg = 'An unknown error occurred'
      Rails.logger.error("EmailController.render_error_json: NO EXCEPTION PROVIDED")
    end

    render json: {error: msg}
    true
  end
end
