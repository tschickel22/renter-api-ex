class CreatePaymentReturns < ActiveRecord::Migration[6.1]
  def change
    create_table :payment_returns do |t|
      t.string :hash_id, index: true
      t.integer :company_id
      t.integer :lease_id, index: true
      t.integer :resident_id
      t.integer :payment_id, index: true
      t.decimal :amount`, precision: 10, scale: 2`
      t.decimal :external_processing_fee, precision: 10, scale: 2
      t.datetime :payment_at

      t.timestamps
    end
  end
end
