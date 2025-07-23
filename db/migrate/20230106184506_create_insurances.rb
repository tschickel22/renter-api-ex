class CreateInsurances < ActiveRecord::Migration[6.1]
  def change
    create_table :insurances do |t|
      t.string :hash_id, index: true
      t.integer :company_id, index: true
      t.integer :lease_resident_id, index: true
      t.integer :api_partner_id
      t.string :status
      t.date :effective_on
      t.date :expires_on
      t.string :external_id
      t.string :insurance_company_name
      t.string :policy_number
      t.decimal :liability_limit, precision: 10, scale: 2
      t.integer :adults_on_policy

      t.string :primary_insured_first_name
      t.string :primary_insured_middle_name
      t.string :primary_insured_last_name
      t.string :primary_insured_suffix
      t.string :primary_insured_street
      t.string :primary_insured_unit_number
      t.string :primary_insured_city
      t.string :primary_insured_state
      t.string :primary_insured_zip
      t.timestamps
    end
  end
end
