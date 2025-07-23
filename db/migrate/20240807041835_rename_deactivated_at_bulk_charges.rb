class RenameDeactivatedAtBulkCharges < ActiveRecord::Migration[6.1]
  def change
    rename_column :bulk_charges, :deactivated_at, :deleted_at
  end
end
