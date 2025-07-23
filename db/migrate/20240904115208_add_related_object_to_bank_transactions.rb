class AddRelatedObjectToBankTransactions < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_transactions, :related_object_id, :integer, after: :bank_account_id
    add_column :bank_transactions, :related_object_type, :string, after: :related_object_id
    add_index :bank_transactions, [:related_object_id, :related_object_type], name: 'bank_txns_related_obj'
  end
end
