class CreateBankTransactions < ActiveRecord::Migration[6.1]
  def change
    create_table :bank_transactions do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :bank_account_id, index: true
      t.string :external_stripe_id, unique: true
      t.string :external_status
      t.datetime :external_updated_at
      t.string :external_refresh_id
      t.string :description
      t.decimal :amount, scale: 2, precision: 10
      t.datetime :transacted_at
      t.timestamps
    end
  end
end
