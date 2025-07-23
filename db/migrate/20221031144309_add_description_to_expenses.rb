class AddDescriptionToExpenses < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :description, :string, after: :expense_on
  end
end
