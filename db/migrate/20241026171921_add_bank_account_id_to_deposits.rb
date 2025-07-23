class AddBankAccountIdToDeposits < ActiveRecord::Migration[6.1]
  def change
    add_column :deposits, :bank_account_id, :integer, index: true, after: :external_id

    execute "UPDATE deposits JOIN bank_accounts ON bank_accounts.external_id = deposits.external_id SET bank_account_id = bank_accounts.id"
  end
end
