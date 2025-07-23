require 'xmlsimple'

class Webhook::MsiController < ApplicationController

  skip_before_action :verify_authenticity_token
  before_action :http_authenticate, only: :show

  def show
    render plain: "Hello."
  end

  def create
    Rails.logger.error("MSI: ")
    Rails.logger.error(request.raw_post)

    # Parse the XML
    data = XmlSimple.xml_in(request.raw_post)
    data.deep_symbolize_keys!

    username = ApiProcessor.read_xml_string(data, 'SignonRq/SignonPswd/CustId/CustLoginId')
    password = ApiProcessor.read_xml_string(data, 'SignonRq/SignonPswd/CustPswd/Pswd')

    # Check the credentials
    if username == Rails.application.credentials.dig(:msi, :webhook_username) && password == Rails.application.credentials.dig(:msi, :webhook_password)
      ProcessInsuranceUpdate.enqueue(data)
      render xml: XmlSimple.xml_out({Result: "Ok"}, rootname: 'MSIACORD')
    else
      render xml: XmlSimple.xml_out({Result: "Authentication Failure"}, rootname: 'MSIACORD'), status: 500
    end


  end

  private

  def http_authenticate
    authenticate_or_request_with_http_basic do |username, password|
      username == Rails.application.credentials.dig(:msi, :webhook_username) && password == Rails.application.credentials.dig(:msi, :webhook_password)
    end
  end

end