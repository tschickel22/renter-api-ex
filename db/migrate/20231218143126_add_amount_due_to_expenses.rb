class AddAmountDueToExpenses < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :amount_due, :decimal, precision: 10, scale: 2, after: :amount

    Expense.all.each do | expense |
      expense.update_amount
      expense.save(validate: false)
    end
  end
end
