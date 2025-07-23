class CreateResidentPaymentMethods < ActiveRecord::Migration[6.1]
  def change
    create_table :resident_payment_methods do |t|
      t.string :hash_id, index: true
      t.string :nickname
      t.integer :resident_id, index: true
      t.integer :company_id
      t.integer :api_partner_id
      t.string :external_id
      t.string :external_token
      t.string :method
      t.string :billing_first_name
      t.string :billing_last_name
      t.string :billing_street
      t.string :billing_street_2
      t.string :billing_city
      t.string :billing_state
      t.string :billing_zip
      t.string :last_four
      t.date :credit_card_expires_on
      t.datetime :billing_agreement_at
      t.string :billing_agreement_ip_address

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
