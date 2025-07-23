class AddOpeningBalanceToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :opened_on, :date, after: :account_type
    add_column :bank_accounts, :opening_balance, :decimal, precision: 10, scale: 2, after: :opened_on
  end
end
