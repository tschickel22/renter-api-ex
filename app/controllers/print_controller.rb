require 'barby'
require 'barby/barcode/code_128'
require 'barby/outputter/png_outputter'
require 'base64'

class PrintController < ApplicationController
  include ApplicationHelper

  def resident_application
    if params[:format] == 'pdfLOCAL'
      @lease_resident = LeaseResident.where(hash_id: params[:id]).first
    else
      @lease_resident = LeaseResident.for_user(current_user).where(hash_id: params[:id]).first
    end

    if @lease_resident.present?
      @lease = @lease_resident.lease
      @current_settings = Setting.for_property(@lease.company_id, @lease.property_id)

      respond_to do |format|
        format.html
        format.pdf do
          render pdf: "Renter Insight Application - #{@lease_resident.resident.full_name}",
          template: "print/resident_application.html.erb"
        end
      end
    end
  end

  def w9
    pdf = PaymentService.generate_w9(current_user.company)

    send_data pdf.to_pdf, type: 'application/pdf', disposition: 'inline', filename: "w9.pdf"
  end

  def zego_agreement
    @company = current_user.company
  end

  def cash_pay_coupon
    lease_resident = LeaseResident.for_user(current_user).where(hash_id: params[:id]).first
    resident_payment_method = ResidentPaymentMethod.ensure_cash_method(lease_resident)

    pdf = PaymentService.generate_cash_pay_coupon(lease_resident, resident_payment_method)

    send_data pdf.to_pdf, type: 'application/pdf', disposition: 'inline', filename: "renter-insight-cash-pay-coupon.pdf"
  end

  def cash_pay_coupon_bar_code
    lease_resident = LeaseResident.where(hash_id: params[:id]).first

    if lease_resident.present?

      @resident_payment_method = lease_resident.resident.resident_payment_methods.where(method: PaymentMethod::METHOD_CASH).last

      if @resident_payment_method.present?
        @base64_barcode = barcode_png_base64(@resident_payment_method.external_id)

        respond_to do |format|
          format.html
          format.json {
            render json: {base64_barcode: @base64_barcode}
          }
          format.pdf do
            render pdf: "renter-insight-cash-pay-bar-code.pdf",
                   template: "print/cash_pay_coupon_bar_code.html.erb"
          end
        end
      end
    end
  end

  private

  def barcode_png_base64(data)
    barcode = Barby::Code128B.new(data.to_s)
    png = Barby::PngOutputter.new(barcode).to_png(height: 90, margin: 5)
    Base64.strict_encode64(png)
  end
end