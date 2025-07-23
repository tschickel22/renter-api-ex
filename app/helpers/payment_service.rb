
include ActionView::Helpers::NumberHelper
require 'open-uri'

class PaymentService

  def self.process_one_time_payment(payment_class, lease_resident, payment_method, amount, payment_fee_type)
    current_settings = Setting.for_lease_resident(lease_resident)
    payment = payment_class.new_for_lease_resident(lease_resident)
    payment.payment_method_id = payment_method.id
    payment.amount = amount
    payment.payment_at = Time.now
    payment.status = Payment::STATUS_NEW
    payment.api_partner_id = RenterInsightZegoApi::API_PARTNER_ID
    payment.fee_type = payment_fee_type
    payment.calculate_fees(payment_method.method, current_settings, payment_fee_type)

    if payment.save

      begin
        # Reset the processor object
        if [Setting::PAYMENT_FEE_TYPE_SCREENING_FEE, Setting::PAYMENT_FEE_TYPE_NSF_FEE].include?(payment_fee_type)
          api = RenterInsightZegoApi.new(nil) # Do not use the company when collecting a screening fee
        else
          api = RenterInsightZegoApi.new(payment.company)
        end

        # And then charge that customer the payment amount
        if api.capture_one_time_payment(payment_method, payment)
          payment_status = api.payment_pending? ? Payment::STATUS_PENDING : Payment::STATUS_SUCCEEDED

          payment.update({
                           external_id: api.read_transaction_id,
                           external_processing_fee: api.read_external_processing_fee,
                           status: payment_status
                         })

        end
      rescue

        Rails.logger.error($!.message)
        Rails.logger.error($!.backtrace.join("\n"))

        return { status: Payment::STATUS_FAILED, payment: payment, api_payment_error_message: "Unknown payment processor error. Please try again."}
      end

      if payment_status == Payment::STATUS_SUCCEEDED || payment_status == Payment::STATUS_PENDING
        if payment.amount > 0 && (payment_class != ResidentPayment || ![Setting::PAYMENT_FEE_TYPE_SCREENING_FEE, Setting::PAYMENT_FEE_TYPE_NSF_FEE].include?(payment_fee_type))
          AccountingService.push_to_ledger(payment, amount_for_ledger: payment.amount)

          # Finally, send the email
          begin

            if payment_class == ResidentPayment
              ResidentMailer.payment_receipt(payment.id).deliver

              if payment_fee_type != Setting::PAYMENT_FEE_TYPE_SCREENING_FEE
                CompanyMailer.send_to_appropriate_users(:payment_receipt, payment.property, payment.id)
              end
            end

          rescue
            Rails.logger.error($!.message)
            Rails.logger.error($!.backtrace.join("\n"))
          end

        end

        return { status: Payment::STATUS_SUCCEEDED, payment: payment}

      else
        return { status: Payment::STATUS_FAILED, payment: payment, api_payment_error_message: api.payment_error_message}
      end
    else
      return {status: "validation_failure", payment: payment}
    end
  end

  def self.refund_payment(payment, current_user, request = nil)
    if payment.present? && payment.eligible_for_return?
      api = RenterInsightZegoApi.new(payment.company)
      call_refund = true

      # If the payment happened within the past day, just void it... if that fails then refund
      if payment.payment_at > (Time.now - 1.day)
        void_result = api.void_transaction(payment, request)

        if void_result.present? && (void_result.to_s.include?("void transaction is complete") || void_result.to_s.include?("already been voided"))
          refund_result = void_result
          call_refund = false # No need to call refund, the void worked
        end
      end

      if call_refund
        refund_result = api.refund_transaction(payment, request)
      end

      if refund_result
        payment_return = PaymentReturn.return_amount(payment, payment.amount, "Refunded by #{current_user.name}")

        return {payment_return: payment_return, success: true}
      else
        return ({errors: {base: api.payment_error_message || "Unable to refund payment. Please contact Renter Insight Support"}, success: false})
      end

    else
      return ({errors: {base: "Payment not eligible for refund"}, success: false})
    end
  end

  def self.process_payout(payout_class, lease_resident, payment_method, amount)

    payout = payout_class.new_for_lease_resident(lease_resident)
    payout.payment_method_id = payment_method.id
    payout.amount = amount
    payout.payment_at = Time.now
    payout.status = Payment::STATUS_NEW
    payout.api_partner_id = RenterInsightZegoApi::API_PARTNER_ID

    if payout.save

      begin
        # Reset the processor object
        api = RenterInsightZegoApi.new(payout.company)

        # And then charge that customer the payout amount
        if api.payout_to_ach(payment_method, payout)
          payout_status = api.payment_pending? ? Payment::STATUS_PENDING : Payment::STATUS_SUCCEEDED

          payout.update({
                          external_id: api.read_transaction_id,
                          external_processing_fee: api.read_external_processing_fee,
                          status: payout_status
                        })

        end
      rescue

        Rails.logger.error($!.message)
        Rails.logger.error($!.backtrace.join("\n"))

        return { status: Payment::STATUS_FAILED, payout: payout, api_payment_error_message: "Unknown payment processor error. Please try again."}
      end

      if payout_status == Payment::STATUS_SUCCEEDED || payout_status == Payment::STATUS_PENDING
        if payout.amount > 0
          AccountingService.push_to_ledger(payout, amount_for_ledger: payout.amount)
        end

        return { status: Payment::STATUS_SUCCEEDED, payout: payout}

      else
        return { status: Payment::STATUS_FAILED, payout: payout, api_payment_error_message: api.payment_error_message}
      end
    else
      return {status: "validation_failure", payout: payout}
    end
  end

  def self.todays_date
    DateTime.now.in_time_zone('US/Mountain').to_date
  end

  def self.tomorrows_date
    (DateTime.now + 1.day).in_time_zone('US/Mountain').to_date
  end

  def self.generate_w9(company)
    company_taxpayer_info = company.company_taxpayer_info

    pdf = CombinePDF.load "#{Rails.root}/public/pdfs/w9-small.pdf"

    text_properties = {font_size: 11, text_align: "left", height: 20, width: 300}

    pdf.pages[0].textbox "#{company_taxpayer_info.name}", text_properties.merge({y: 682, x: 40})
    pdf.pages[0].textbox "#{company_taxpayer_info.business_name}", text_properties.merge({y: 658, x: 40})
    pdf.pages[0].textbox "#{company_taxpayer_info.street}", text_properties.merge({y: 527, x: 40})
    pdf.pages[0].textbox "#{company_taxpayer_info.city_state_zip}", text_properties.merge({y: 503, x: 40})

    pdf.pages[0].textbox "#{company_taxpayer_info.account_numbers}", text_properties.merge({y: 479, x: 40})
    pdf.pages[0].textbox "#{company_taxpayer_info.requesters_name_and_address}", text_properties.merge({y: 527, x: 362, width: 182})

    if company_taxpayer_info.tax_classification == "sole"
      pdf.pages[0].textbox company_taxpayer_info.ssn, text_properties.merge({y: 419, x: 390, height: 40, box_color: [1,1,1]}) if !company_taxpayer_info.ssn.blank?
    else
      pdf.pages[0].textbox company_taxpayer_info.ein, text_properties.merge({y: 370, x: 390, height: 40, box_color: [1,1,1]}) if !company_taxpayer_info.ein.blank?
    end

    pdf.pages[0].textbox "#{company_taxpayer_info.signature}", text_properties.merge({y: 228, x: 104})
    pdf.pages[0].textbox company_taxpayer_info.updated_at.strftime('%m/%d/%Y'), text_properties.merge({y: 228, x: 390})

    tax_classification_position = case company_taxpayer_info.tax_classification
                                  when "sole"
                                    {y: 618, x: 36}
                                  when "c_corp"
                                    {y: 620, x: 151}
                                  when "s_corp"
                                    {y: 620, x: 222}
                                  when "partnership"
                                    {y: 620, x: 294}
                                  when "trust"
                                    {y: 620, x: 366}
                                  when "llc"
                                    {y: 595, x: 36}
                                  when "other"
                                    {y: 548, x: 36}
                                  else
                                    nil
                                  end

    pdf.pages[0].textbox "X", text_properties.merge(tax_classification_position) if tax_classification_position.present?
    pdf.pages[0].textbox "#{company_taxpayer_info.llc_tax_classification}", text_properties.merge({y: 596, x: 387}) if !company_taxpayer_info.llc_tax_classification.blank?
    pdf.pages[0].textbox "#{company_taxpayer_info.other_tax_classification}", text_properties.merge({y: 548, x: 135}) if !company_taxpayer_info.other_tax_classification.blank?
    pdf.pages[0].textbox "#{company_taxpayer_info.exempt_payee_code}", text_properties.merge({y: 610, x: 520}) if !company_taxpayer_info.exempt_payee_code.blank?
    pdf.pages[0].textbox "#{company_taxpayer_info.exempt_from_facta}", text_properties.merge({y: 571, x: 480}) if !company_taxpayer_info.exempt_from_facta.blank?

    return pdf
  end

  def self.generate_cash_pay_coupon(lease_resident, resident_payment_method)

    pdf = CombinePDF.load "#{Rails.root}/public/pdfs/cash-pay-coupon.pdf"

    text_properties = {font: :Helvetica, font_size: 14, text_align: "left", height: 20, width: 300}

    y = 407
    x = 380
    y_space = 14

    pdf.pages[0].textbox "Resident Name:", text_properties.merge({y: y, x: x, font: :"Helvetica-Bold"})
    y -= y_space * 2
    pdf.pages[0].textbox "#{lease_resident.resident.name}", text_properties.merge({y: y, x: x})

    y -= y_space * 2
    pdf.pages[0].textbox "Due Date: #{todays_date.next_month.beginning_of_month.strftime("%m/%d/%Y")}", text_properties.merge({y: y, x: x})

    y -= y_space * 2
    pdf.pages[0].textbox "Cash Pay #: #{resident_payment_method.external_id}", text_properties.merge({y: y, x: x})

    y -= y_space * 2
    pdf.pages[0].textbox "Balance Due: #{number_to_currency(lease_resident.lease.ledger_balance)}", text_properties.merge({y: y, x: x, font: :"Helvetica-Bold"})

    self.append_barcode_pdf(pdf, lease_resident.hash_id)

    return pdf
  end

  def self.append_barcode_pdf(pdf, lease_resident_hash_id)
    url = "#{SystemMailer.base_url}/print/#{lease_resident_hash_id}/cash_pay_coupon_bar_code.pdf"

    barcode_pdf = URI.open(url)
    combined_barcode = CombinePDF.parse(barcode_pdf.read)

    pdf.pages.each {|page| page << combined_barcode.pages[0]} # notice the << operator is on a page and not a PDF object.

  end
end