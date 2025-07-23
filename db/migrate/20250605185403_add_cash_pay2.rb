class AddCashPay2 < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :payment_fee_cash_resident, :decimal, precision: 10, scale: 2, after: :payment_fee_debit_card_property, default: 4.00
  end
end
