class AddDefaultScreeningPaymentMethodIdToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :default_screening_payment_method_id, :integer, after: :default_screening_package_id
  end
end
