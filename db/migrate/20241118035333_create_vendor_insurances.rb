class CreateVendorInsurances < ActiveRecord::Migration[6.1]
  def change
    create_table :vendor_insurances do |t|
      t.integer :vendor_id, index: true
      t.integer :insurance_type_id, index: true
      t.date :effective_on
      t.date :expires_on
      t.string :insurance_company_name
      t.string :policy_number
      t.decimal :liability_limit, precision: 10, scale: 2
      t.timestamps
      t.datetime :deleted_at
    end
  end
end
