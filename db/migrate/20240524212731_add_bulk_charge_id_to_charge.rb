class AddBulkChargeIdToCharge < ActiveRecord::Migration[6.1]
  def change
    add_column :charges, :bulk_charge_id, :integer, after: :amount
  end
end
