class AddAccountPurposeToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :account_purpose, :string, after: :name
  end
end
