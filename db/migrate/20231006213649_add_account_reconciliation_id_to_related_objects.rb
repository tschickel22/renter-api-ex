class AddAccountReconciliationIdToRelatedObjects < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :account_reconciliation_id, :integer, index: true, after: :maintenance_request_id
    add_column :ledger_items, :account_reconciliation_id, :integer, index: true, after: :transaction_at
    add_column :journal_entry_splits, :account_reconciliation_id, :integer, index: true, after: :description
  end
end
