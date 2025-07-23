class Webhook::TransUnionController < ApplicationController

  skip_before_action :verify_authenticity_token

  def ping
    render plain: "Ok"
  end

  def reports_status
    Rails.logger.error("TU Reports Status: ")
    Rails.logger.error(request.raw_post)
    HandleScreeningReportUpdate.enqueue(request.raw_post)
    render plain: "Ok"
  end

  def manual_authentication_status
    Rails.logger.error("TU Manual Authentication Status: ")
    Rails.logger.error(request.raw_post)

    HandleScreeningReportUpdate.enqueue(request.raw_post)
    render plain: "Ok"
  end
end