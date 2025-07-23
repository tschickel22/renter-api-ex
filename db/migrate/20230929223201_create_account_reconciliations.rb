class CreateAccountReconciliations < ActiveRecord::Migration[6.1]
  def change
    create_table :account_reconciliations do |t|
      t.string :hash_id, index: true
      t.integer :company_id, index: true
      t.integer :bank_account_id, index: true
      t.string :status
      t.date :begin_on
      t.date :end_on
      t.decimal :beginning_balance, precision: 12, scale: 2
      t.decimal :cleared_balance, precision: 12, scale: 2
      t.decimal :ending_balance, precision: 12, scale: 2

      t.decimal :credit_amount, precision: 12, scale: 2
      t.decimal :debit_amount, precision: 12, scale: 2
      t.integer :credit_count
      t.integer :debit_count

      t.datetime :closed_at
      t.integer :closed_by_user_id
      t.text :account_entry_object_ids

      t.timestamps
    end
  end
end
