class AddAccountCodeToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :account_id, :integer, index:true, after: :name
  end
end
