class CreateResidents < ActiveRecord::Migration[6.1]
  def change
    create_table :residents do |t|
      t.string :hash_id
      t.integer :property_id
      t.string :first_name
      t.string :middle_name
      t.string :last_name
      t.string :suffix
      t.string :email
      t.string :phone_number
      t.boolean :no_tax_id
      t.string :encrypted_tax_id
      t.string :encrypted_tax_id_iv
      t.string :encrypted_date_of_birth
      t.string :encrypted_date_of_birth_iv
      t.integer :income
      t.text :income_notes
      t.string :id_type
      t.string :id_issuer
      t.string :encrypted_id_card_number
      t.string :encrypted_id_card_number_iv
      t.datetime :screening_agreement_at
      t.string :screening_agreement_ip_address

      t.timestamps
      t.datetime :deleted_at

    end
  end
end
