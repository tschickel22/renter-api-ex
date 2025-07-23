class CreateAccountingEntries < ActiveRecord::Migration[6.1]
  def change
    create_table :account_entries do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :unit_id, index: true
      t.date :entry_on
      t.integer :accrual_account_id, index: true
      t.integer :cash_account_id, index: true
      t.decimal :amount, precision: 10, scale: 2
      t.integer :related_object_id
      t.string :related_object_type

      t.timestamps
    end

    add_index :account_entries, [:related_object_id, :related_object_type], name: 'entry_object'
  end
end
