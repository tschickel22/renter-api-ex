class AddAlternateExternalIdToPaymentMethods < ActiveRecord::Migration[6.1]
  def change
    add_column :payment_methods, :alternate_external_id, :string, after: :external_id
  end
end
