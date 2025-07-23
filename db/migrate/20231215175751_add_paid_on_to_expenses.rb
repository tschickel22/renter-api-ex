class AddPaidOnToExpenses < ActiveRecord::Migration[6.1]
  def change
    rename_column :expenses, :expense_on, :due_on
    add_column :expenses, :paid_on, :date, after: :due_on, index: true
    execute "UPDATE expenses SET paid_on = due_on"
  end
end
