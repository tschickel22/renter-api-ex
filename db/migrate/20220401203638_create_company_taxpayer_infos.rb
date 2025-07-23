class CreateCompanyTaxpayerInfos < ActiveRecord::Migration[6.1]
  def change
    create_table :company_taxpayer_infos do |t|
      t.integer :company_id, index:true
      t.string :name
      t.string :business_name
      t.string :tax_classification
      t.string :llc_tax_classification
      t.string :other_tax_classification
      t.string :exempt_payee_code
      t.string :exempt_from_facta
      t.string :street
      t.string :city_state_zip
      t.string :requesters_name_and_address
      t.string :account_numbers
      t.string :encrypted_ssn
      t.string :encrypted_ssn_iv
      t.string :encrypted_ein
      t.string :encrypted_ein_iv
      t.string :signature

      t.timestamps
    end
  end
end
