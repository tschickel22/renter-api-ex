class DropAccountTransactions < ActiveRecord::Migration[6.1]
  def change
    drop_table :account_transactions

    create_table :journal_entries do |t|
      t.string :hash_id, index: true
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :unit_id, index: true
      t.date :entry_on
      t.text :memo
      t.string :frequency #one_time, monthly, annually
      t.integer :end_after

      t.timestamps
    end

    execute "ALTER TABLE journal_entries AUTO_INCREMENT = 500000"

    create_table :journal_entry_splits do |t|
      t.integer :journal_entry_id, index: true
      t.integer :account_id, index: true
      t.decimal :amount, precision: 10, scale: 2
      t.string :description
      t.timestamps
    end
  end
end
