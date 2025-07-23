class AddPartialPaymentSetting < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :allow_partial_payments, :boolean, default: true
  end
end
