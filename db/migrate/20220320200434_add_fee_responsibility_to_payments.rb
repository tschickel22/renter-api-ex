class AddFeeResponsibilityToPayments < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :fee_responsibility, :string, after: :fee
    add_column :payment_returns, :fee_responsibility, :string, after: :fee
  end
end
