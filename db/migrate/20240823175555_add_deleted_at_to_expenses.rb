class AddDeletedAtToExpenses < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :deleted_at, :datetime, after: :updated_at
  end
end
