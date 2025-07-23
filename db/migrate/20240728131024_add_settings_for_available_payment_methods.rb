class AddSettingsForAvailablePaymentMethods < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :available_payment_methods_default_ach, :boolean, default: true
    add_column :settings, :available_payment_methods_default_credit_card, :boolean, default: true
    add_column :settings, :available_payment_methods_default_debit_card, :boolean, default: true
    add_column :settings, :available_payment_methods_co_credit_card, :boolean, default: true
    add_column :settings, :available_payment_methods_co_ach, :boolean, default: true
    add_column :settings, :available_payment_methods_co_debit_card, :boolean, default: true
  end
end
