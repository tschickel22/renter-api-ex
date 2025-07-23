class AddEmployeeIdToExpenses < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :employee_user_id, :integer, index: true, after: :bank_account_id
  end
end
