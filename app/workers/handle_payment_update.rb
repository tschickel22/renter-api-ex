class HandlePaymentUpdate

  def self.enqueue(mode, raw_data)
    if Rails.env.development?
      HandlePaymentUpdate.perform(mode, raw_data)
    else
      Resque.enqueue_to("billing", HandlePaymentUpdate, mode, raw_data)
    end
  end

  def self.perform(mode, raw_data)
    payment_details = JSON.parse(raw_data)
    payment_details.deep_symbolize_keys!

    if !payment_details[:PayLeaseTransactionID].blank?
      # Try to find this payment, to be sure we aren't doubling up
      payment = Payment.where(external_id: payment_details[:PayLeaseTransactionID]).first

      if payment.nil?
        # Figure out which resident...
        payment_method = ResidentPaymentMethod.joins(:resident).where(resident: {hash_id: payment_details[:ResidentID].gsub("ResidentPaymentMethod:", "")}, method: PaymentMethod::METHOD_CASH).first

        if payment_method.present?
          if payment_method.is_cash?
            lease_resident = payment_method.resident.current_lease.lease_residents.where(resident_id: payment_method.resident.id).first
            current_settings = Setting.for_lease_resident(lease_resident)

            payment = ResidentPayment.new_for_lease_resident(lease_resident)
            payment.payment_at = DateTime.parse(payment_details[:TDate])
            payment.status = Payment::STATUS_SUCCEEDED
            payment.payment_method_id = payment_method.id
            payment.fee = current_settings.payment_fee_cash_resident
            payment.amount = BigDecimal(payment_details[:TAmount]) - payment.fee
            payment.fee_responsibility = Payment::RESPONSIBILITY_RESIDENT
            payment.fee_type = Setting::PAYMENT_FEE_TYPE_ONE_TIME_CHARGES
            payment.api_partner_id = RenterInsightZegoApi::API_PARTNER_ID
            payment.external_id = payment_details[:PayLeaseTransactionID]

            if payment.save
              AccountingService.push_to_ledger(payment)
            else
              raise "Could not save payment: #{payment.errors.full_messages.join(", ")}"
            end
          else
            raise "Payment method not cash! PM ##{payment_method.id}"
          end
        else
          raise "Could not find payment method #{payment_details[:ResidentID]}"
        end
      else
        puts "Payment already exists: #{payment_details[:PayLeaseTransactionID]}"
      end
    end
  end
end