class PagesController < ApplicationController

  require "rqrcode"

  def index
    redirect_to "/dashboard"
  end

  def show
    @page = Page.where(url: params[:id]).first
  end

  def maintenance_request_jump

    if current_user.present?
      maintenance_request = MaintenanceRequest.for_user(current_user).where(hash_id: params[:id]).first
    else
      maintenance_request = MaintenanceRequest.where(hash_id: params[:id]).first
    end

    if maintenance_request.present?
      if current_user.present? || !maintenance_request.assigned_to.is_a?(Vendor)
        redirect_to "/maintenance_requests/#{maintenance_request.hash_id}/edit"
      else
        redirect_to "/vendor_maintenance_requests/#{maintenance_request.hash_id}/vendor_edit"
      end
    elsif !current_user.is_resident?
      redirect_to "/dashboard?maintenance_request=Not+Found"
    else
      redirect_to "/portal?maintenance_request=Not+Found"
    end
  end

  def qr_code
    maintenance_request = MaintenanceRequest.where(hash_id: params[:id]).first
    qrcode = RQRCode::QRCode.new(SystemMailer.base_url + (maintenance_request.present? ? "/mr/#{maintenance_request.hash_id}" : "/mr/unknown"))

    svg = qrcode.as_svg(
      color: "000",
      shape_rendering: "crispEdges",
      module_size: 11,
      standalone: true,
      use_path: true
    )

    render inline: svg, content_type: 'image/svg+xml'

  end

  def unsubscribe
    if params[:email].present?
      @email = params[:email]
    elsif params[:e].present?
      @email = Base64.decode64(params[:e])
    else
      @email = nil
    end

    UnsubscribedEmail.find_or_create_by(email: @email) if !@email.blank?

  end
end