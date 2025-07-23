class AddChecklistItemsToLease < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :move_in_checklist_items, :string, after: :move_out_on
    add_column :leases, :move_out_checklist_items, :string, after: :move_in_checklist_items
  end
end
