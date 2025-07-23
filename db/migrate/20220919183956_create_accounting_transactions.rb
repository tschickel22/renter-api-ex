class CreateAccountingTransactions < ActiveRecord::Migration[6.1]
  def change
    create_table :account_transactions do |t|
      t.integer :company_id, index: true
      t.decimal :amount, precision: 10, scale: 2
      t.date :transaction_on
      t.string :description

      t.timestamps
    end
  end
end
