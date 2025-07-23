class AddSecurityDepositRefundMode < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :security_deposit_refund_amount, :decimal, precision: 10, scale: 2, after: :security_deposit_paid, default: 0
    add_column :leases, :security_deposit_refund_mode, :string, after: :security_deposit_refund_amount
    add_column :leases, :security_deposit_refund_payment_method_id, :integer, after: :security_deposit_refund_mode
    add_column :leases, :security_deposit_refund_check_number, :string, after: :security_deposit_refund_mode
  end
end
