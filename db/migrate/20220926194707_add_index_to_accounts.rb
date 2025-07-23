class AddIndexToAccounts < ActiveRecord::Migration[6.1]
  def change
    add_index :accounts, [:code, :company_id], unique: true
  end
end
