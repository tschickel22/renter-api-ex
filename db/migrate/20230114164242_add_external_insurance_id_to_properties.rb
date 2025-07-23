class AddExternalInsuranceIdToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :external_insurance_id, :string, after: :external_payments_id
  end
end
