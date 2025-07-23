class AddPropertyIdToPayments < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :property_id, :integer, after: :company_id
    add_column :payment_returns, :property_id, :integer, after: :company_id
  end
end
