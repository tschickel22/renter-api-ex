class CreateLedgerItems < ActiveRecord::Migration[6.1]
  def change
    create_table :ledger_items do |t|
      t.string :hash_id, index: true
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :lease_id, index: true
      t.integer :related_object_id, index: true
      t.string :related_object_type
      t.decimal :amount, precision: 10, scale: 2
      t.date :due_on
      t.datetime :transaction_at

      t.timestamps
    end
  end
end
