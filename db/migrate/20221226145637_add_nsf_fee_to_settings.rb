class AddNsfFeeToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :nsf_fee, :decimal, precision: 10, scale: 2, default: 10, after: :late_rent_fee_maximum_amount
    add_column :settings, :charge_residents_nsf_and_late_fee, :boolean, default: false, after: :nsf_fee
  end
end
