class UpdateLeaseDecimals < ActiveRecord::Migration[6.1]
  def change
    change_column :leases, :rent, :decimal, precision: 10, scale: 2
    change_column :leases, :security_deposit, :decimal, precision: 10, scale: 2
  end
end
