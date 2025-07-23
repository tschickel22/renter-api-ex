class AddLastReconciledAtToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :reconciled_until, :date, after: :opening_balance
  end
end
