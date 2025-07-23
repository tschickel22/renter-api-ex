class AddExternalPaymentIdToEntities < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_payments_id, :string, after: :payments_onboard_status
    add_column :properties, :external_payments_id, :string, after: :external_screening_id
  end
end
