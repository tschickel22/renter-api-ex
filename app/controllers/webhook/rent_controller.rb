require 'xmlsimple'

class Webhook::RentController < ApplicationController

  skip_before_action :verify_authenticity_token

  def show
    if params[:key] == Rails.application.credentials.dig(:rent, :inbound_webhook_key)
      render xml: RenterInsightRentApi.new.generate_all
    else
      render file: "#{Rails.root}/public/404.html",  status: 404
    end
  end
end