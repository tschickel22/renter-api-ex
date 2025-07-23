require 'xmlsimple'

class Webhook::ZumperController < ApplicationController

  skip_before_action :verify_authenticity_token

  def show
    if params[:key] == Rails.application.credentials.dig(:zumper, :inbound_webhook_key)
      render xml: RenterInsightZumperApi.new.generate_all
    else
      render file: "#{Rails.root}/public/404.html",  status: 404
    end
  end
end