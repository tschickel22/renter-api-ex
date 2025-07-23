class CreateDepositItems < ActiveRecord::Migration[6.1]
  def change
    create_table :deposit_items do |t|
      t.integer :deposit_id
      t.integer :company_id
      t.integer :payment_id
      t.string :external_id
      t.date :initiated_on
      t.date :payout_on
      t.string :payment_type
      t.string :bill_type
      t.string :external_reference_id
      t.decimal :amount, precision: 10, scale: 2
      t.timestamps
    end
  end
end
