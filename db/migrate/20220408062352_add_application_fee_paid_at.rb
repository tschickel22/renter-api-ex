class AddApplicationFeePaidAt < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :application_fee_paid_at, :datetime, after: :screening_package_id
  end
end
