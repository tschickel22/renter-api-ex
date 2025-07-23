class AddFeeToPayments < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :fee, :decimal, scale: 2, precision: 10, after: :amount
    add_column :payment_returns, :fee, :decimal, scale: 2, precision: 10, after: :amount
  end
end
