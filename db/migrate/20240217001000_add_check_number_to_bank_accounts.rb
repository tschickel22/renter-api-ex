class AddCheckNumberToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :check_number, :integer, after: :opening_balance
  end
end
