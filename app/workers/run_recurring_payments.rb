class RunRecurringPayments
  include ApplicationHelper

  def self.enqueue(lease_resident_id)
    Resque.enqueue_to("billing", RunRecurringPayments, lease_resident_id)
  end

  def self.perform(lease_resident_id = nil)
    puts "*** START #{self.to_s} ****"

    #
    # FIX UNSCHEDULED PAYMENTS
    #
    LeaseResident.joins(:lease).includes(:lease).where(lease: {status: Lease::STATUS_CURRENT}).where.not(recurring_payment_starts_on: nil).where(recurring_payment_next_payment_on: nil, recurring_payment_frequency: [LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY]).each do | lease_resident |
      lease_resident.recurring_payment_next_payment_on = lease_resident.calculate_next_payment_on(lease_resident.recurring_payment_starts_on)
      lease_resident.save(validate: false) if lease_resident.recurring_payment_next_payment_on.present?
    end

    #
    # RUN RECURRING PAYMENTS
    #
    if lease_resident_id.nil?
      # Find all current leases, determine if there is a balance due and whether or not a late fee should be added
      LeaseResident.joins({lease: :property}).includes(:lease).where(lease: {status: Lease::STATUS_CURRENT, properties: {status: Property::STATUS_ACTIVE}}).where(recurring_payment_next_payment_on: PaymentService.todays_date(), recurring_payment_frequency: [LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY]).each do | lease_resident |
        RunRecurringPayments.enqueue(lease_resident.id)
      end
    else
      run(lease_resident_id)
    end
  end

  def self.run(lease_resident_id)
    lease_resident = LeaseResident.find(lease_resident_id)

    # Calculate the payment amount
    payment_amount = if lease_resident.recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY
                       lease_resident.lease.ledger_balance
                     elsif lease_resident.recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY
                       lease_resident.lease.ledger_balance(PaymentService.todays_date() + 1.month) / 2
                     elsif lease_resident.recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY
                       lease_resident.lease.ledger_balance(PaymentService.todays_date() + 1.month) / 4
                     end

    # Should we schedule the next payment?
    next_payment_on = lease_resident.calculate_next_payment_on(PaymentService.tomorrows_date())

    # Queue the payment
    if payment_amount > 0
      payment_result = PaymentService.process_one_time_payment(ResidentPayment, lease_resident, lease_resident.recurring_payment_method, payment_amount, Setting::PAYMENT_FEE_TYPE_RECURRING_CHARGES)

      # Were we successful? If not, schedule another attempt tomorrow
      if payment_result.nil? || payment_result[:status] != Payment::STATUS_SUCCEEDED
        next_payment_on = PaymentService.todays_date() + 1.day
      end
    end

    lease_resident.recurring_payment_next_payment_on = next_payment_on
    lease_resident.save
  end
end