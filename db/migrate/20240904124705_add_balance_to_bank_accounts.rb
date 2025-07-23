class AddBalanceToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :balance, :decimal, scale: 2, precision: 10, after: :opening_balance
    add_column :bank_accounts, :transactions_refreshed_at, :datetime, after: :balance
    add_column :bank_accounts, :unconfirmed_transactions, :integer, after: :transactions_refreshed_at, default: 0
  end
end
