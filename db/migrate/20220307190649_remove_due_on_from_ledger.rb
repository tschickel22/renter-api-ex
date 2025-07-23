class RemoveDueOnFromLedger < ActiveRecord::Migration[6.1]
  def change
    remove_column :ledger_items, :due_on
    add_column :charges, :due_on, :date, after: :charge_type_id
  end
end
