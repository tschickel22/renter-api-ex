include WorkerHelper

class PushInvoiceToCrm
  def self.enqueue(property_id)
    Resque.enqueue_to("crm", self, property_id)
  end

  def self.perform(property_id = nil)
    if property_id.nil?
      Payment.succeeded.joins(:company).where("LENGTH(companies.external_crm_id) > 0 AND payments.payment_at > now() - INTERVAL 2 DAY").pluck(:property_id).uniq.each do | property_id |
        if !Rails.env.development?
          PushInvoiceToCrm.enqueue(property_id)
        end
      end
    else
      property = Property.find(property_id)
      PushInvoiceToCrm.push_invoice_to_crm(property)
    end
  end

  def self.push_invoice_to_crm(property)
    end_time = Time.now
    invoice_date = end_time.in_time_zone('US/Mountain').beginning_of_month.to_date
    invoice_search_result = RenterInsightZohoApi.new.find_invoice(property.external_crm_id, invoice_date)

    if invoice_search_result.is_a?(Hash)
      existing_invoice = RenterInsightZohoApi.new.get_invoice(invoice_search_result[:data].first[:id])
      existing_invoice = existing_invoice[:data].is_a?(Array) ? existing_invoice[:data].first : existing_invoice[:data]
      existing_invoiced_items = existing_invoice[:Invoiced_Items]
    else
      existing_invoice = nil
      existing_invoiced_items = []
    end

    updates =
      {
        Account_Name: {id: property.external_crm_id},
        Subject: "Renter Insight Monthly Charges",
        Invoice_Number: "#{PaymentService.todays_date.beginning_of_month.strftime('%Y%m')}-#{property.id.to_s.rjust(7, "0")}",
        Invoice_Date: PaymentService.todays_date.beginning_of_month.strftime('%Y-%m-%d')
      }


    #
    # PAYMENTS
    #
    payments_by_method = {
      PaymentMethod::METHOD_ACH => [],
      PaymentMethod::METHOD_DEBIT_CARD => [],
      PaymentMethod::METHOD_CREDIT_CARD => []
    }

    ResidentPayment.includes(:payment_method).succeeded.where(property: property).where("IFNULL(fee_type, '') != '#{Setting::PAYMENT_FEE_TYPE_SCREENING_FEE}' AND payment_at BETWEEN :start_date AND :end_date", {start_date: end_time.beginning_of_month, end_date: end_time}).each do | payment |
      payment_method = payment.payment_method
      payment_method ||= PaymentMethod.unscoped.find(payment.payment_method_id)
      payments_by_method[payment_method.method] << payment
    end

    ach_item = find_item(existing_invoiced_items, "5406491000000999078")
    ach_item[:Date] = PaymentService.todays_date.strftime('%Y-%m-%d')
    ach_item[:Quantity_1] = payments_by_method[PaymentMethod::METHOD_ACH].count
    ach_item[:Paid] = payments_by_method[PaymentMethod::METHOD_ACH].collect{|p| p.amount}.sum

    debit_item = find_item(existing_invoiced_items, "5406491000000999073")
    debit_item[:Date] = PaymentService.todays_date.strftime('%Y-%m-%d')
    debit_item[:Quantity_1] = payments_by_method[PaymentMethod::METHOD_DEBIT_CARD].count
    debit_item[:Paid] = payments_by_method[PaymentMethod::METHOD_DEBIT_CARD].collect{|p| p.amount}.sum

    credit_item = find_item(existing_invoiced_items, "5406491000000999068")
    credit_item[:Date] = PaymentService.todays_date.strftime('%Y-%m-%d')
    credit_item[:Quantity_1] = payments_by_method[PaymentMethod::METHOD_CREDIT_CARD].count
    credit_item[:Paid] = payments_by_method[PaymentMethod::METHOD_CREDIT_CARD].collect{|p| p.amount}.sum

    updates[:Invoiced_Items] = [ach_item, debit_item, credit_item]

    #
    # SCREENINGS
    #
    screenings_by_package = ScreeningPackage.all.inject({}) do |acc, screening_package |
      acc[screening_package.id] = []
      acc
    end

    LeaseResident.includes(:lease).where(lease: {property: property}).where("screening_package_id IS NOT NULL AND screening_fee_paid_at BETWEEN :start_date AND :end_date", {start_date: end_time.beginning_of_month, end_date: end_time}).each do | lease_resident |
      screenings_by_package[lease_resident.screening_package_id] << lease_resident
    end

    ScreeningPackage.all.each do | screening_package |
      item = find_item(existing_invoiced_items, screening_package.external_product_id)
      item[:Date] = PaymentService.todays_date.strftime('%Y-%m-%d')
      item[:Quantity_1] = screenings_by_package[screening_package.id].count
      item[:Paid] = screenings_by_package[screening_package.id].count * screening_package.price

      updates[:Invoiced_Items] << item
    end

    if existing_invoice.nil?
      RenterInsightZohoApi.new.create_invoice(updates)
    else
      RenterInsightZohoApi.new.update_invoice(existing_invoice[:id], updates)
    end


  end

  def self.find_item(existing_invoiced_items, id)
    item = nil

    if existing_invoiced_items.present?
      item = existing_invoiced_items.find{|item| item[:Product_Name][:id] == id}

      if item.present?
        #  item["$in_merge".to_sym] = true
      end
    end

    item || {Product_Name: {id: id}}
  end
end