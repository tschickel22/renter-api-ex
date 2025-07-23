class AddRecurringPaymentFieldsToLeaseResident < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :recurring_payment_frequency, :string, after: :eviction_count
    add_column :lease_residents, :recurring_payment_starts_on,  :date, after: :recurring_payment_frequency
    add_column :lease_residents, :recurring_payment_method_id,  :integer, after: :recurring_payment_starts_on

    change_column :lease_residents, :created_at, :datetime, after: :screening_completed_at
    change_column :lease_residents, :updated_at, :datetime, after: :created_at
  end
end
