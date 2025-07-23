class AddMilesToExpenseAccountEntry < ActiveRecord::Migration[6.1]
  def change
    add_column :expense_account_splits, :miles, :decimal, precision: 10, scale: 2, after: :amount
  end
end
