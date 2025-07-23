class AddAutoPayDayOfWeekToLeaseResident < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :recurring_payment_day_of_week, :integer, after: :recurring_payment_starts_on
  end
end
