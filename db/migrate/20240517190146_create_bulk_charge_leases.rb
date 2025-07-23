class CreateBulkChargeLeases < ActiveRecord::Migration[6.1]
  def change
    create_table :bulk_charge_leases do |t|
      t.integer "company_id", index: true
      t.integer "property_id", index: true
      t.integer "lease_id", index: true
      t.integer "bulk_charge_id", index: true
      t.decimal "amount", precision: 10, scale: 2
      t.string "description"
      t.timestamps
    end
  end
end
