class AddStatusToBankTransactions < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_transactions, :status, :string, after: :bank_account_id, index: true

    execute "UPDATE bank_transactions SET status = CASE WHEN related_object_id IS NOT NULL THEN '#{BankTransaction::STATUS_CATEGORIZED}' ELSE '#{BankTransaction::STATUS_NEW}' END"
  end
end
