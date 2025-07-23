class AddCashPay < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :available_payment_methods_default_cash, :boolean, default: true
    add_column :settings, :available_payment_methods_co_cash, :boolean, default: true
  end
end
