class CreateExpenseAccountSplits < ActiveRecord::Migration[6.1]
  def change
    create_table :expense_account_splits do |t|
      t.integer :expense_id, index: true
      t.integer :account_id, index: true
      t.decimal :amount, precision: 10, scale: 2

      t.timestamps
    end
  end
end
