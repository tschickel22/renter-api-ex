class CreatePayments < ActiveRecord::Migration[6.1]
  def change
    create_table :payments do |t|
      t.string :hash_id, index: true
      t.string :status
      t.string :payment_type
      t.integer :company_id, index: true
      t.integer :lease_id, index: true
      t.integer :resident_id
      t.integer :payment_method_id
      t.decimal :amount, precision: 10, scale: 2
      t.decimal :external_processing_fee, precision: 10, scale: 2
      t.datetime :payment_at
      t.integer :api_partner_id
      t.string :external_id
      t.string :external_message

      t.timestamps
    end
  end
end
