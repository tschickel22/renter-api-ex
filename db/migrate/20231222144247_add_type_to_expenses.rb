class AddTypeToExpenses < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :type, :string, after: :hash_id

    execute "UPDATE expenses SET type = '#{Expense.to_s}'"
  end
end
