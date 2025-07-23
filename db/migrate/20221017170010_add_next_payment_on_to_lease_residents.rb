class AddNextPaymentOnToLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :recurring_payment_next_payment_on, :date, after: :recurring_payment_starts_on

    LeaseResident.where(recurring_payment_frequency: [LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY]).each do | lease_resident |
      next_payment_on = lease_resident.calculate_next_payment_on
      lease_resident.recurring_payment_next_payment_on = next_payment_on
      lease_resident.save(validate: false)
    end
  end
end
