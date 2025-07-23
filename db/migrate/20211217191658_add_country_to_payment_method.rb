class AddCountryToPaymentMethod < ActiveRecord::Migration[6.1]
  def change
    add_column :resident_payment_methods, :billing_country, :string
  end
end
