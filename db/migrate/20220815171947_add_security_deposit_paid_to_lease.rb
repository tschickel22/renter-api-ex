class AddSecurityDepositPaidToLease < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :security_deposit_paid, :decimal, precision: 10, scale: 2, after: :security_deposit, default: 0
  end
end
