class AddDeletedAtToLedgerItems < ActiveRecord::Migration[6.1]
  def change
    add_column :ledger_items, :deleted_at, :datetime, after: :updated_at
  end
end
