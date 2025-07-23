class ChargeCompanyForScreening
  include ApplicationHelper

  def self.enqueue(lease_resident_id)
    Resque.enqueue_to("billing", ChargeCompanyForScreening, lease_resident_id)
  end

  def self.perform(lease_resident_id)

    Rails.logger.error("START #{self.to_s}: #{lease_resident_id}")

    # Make sure we haven't already run a payment
    lease_resident = LeaseResident.find(lease_resident_id)

    if lease_resident.screening_fee_paid_at.present?
      Rails.logger.error("#{self.to_s}: #{lease_resident_id}: Already paid")
      return {status: Payment::STATUS_SUCCEEDED}
    end

    charge_type = ChargeType.where(name: "Fees").first
    charge_description = "Screening Fee ##{lease_resident.hash_id}"
    screening_fee_amount = lease_resident.screening_package.price

    # The Property is footing this bill
    if !CompanyCharge.where({ lease_id: lease_resident.lease_id, charge_type_id: charge_type.id, description: charge_description}).exists?
      charge = CompanyCharge.new_for_lease(lease_resident.lease)
      charge.charge_type = charge_type
      charge.description = charge_description
      charge.due_on = PaymentService.todays_date()
      charge.frequency = Charge::FREQUENCY_ONE_TIME
      charge.amount = screening_fee_amount

      if charge.save
        AccountingService.push_to_ledger(charge)
      else
        render_json({errors: {base: charge.errors.full_messages.join(", ")}}, false)
        return
      end
    end

    payment_result = PaymentService.process_one_time_payment(CompanyPayment, lease_resident, lease_resident.lease.screening_payment_method, screening_fee_amount, Setting::PAYMENT_FEE_TYPE_SCREENING_FEE)

    if payment_result[:status] == Payment::STATUS_SUCCEEDED
      lease_resident.update({screening_fee_paid_at: Time.now})
    end

    Rails.logger.error("END #{self.to_s}: #{lease_resident_id}")

    return payment_result
  end
end