class AddScreeningFeePaidAt < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :screening_fee_paid_at, :datetime, after: :application_fee_paid_at
  end
end
