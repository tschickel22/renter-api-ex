class CreateItems < ActiveRecord::Migration[6.1]
  def change
    rename_table :vendor_categories, :items
    add_column :items, :type, :string, after: :id

    execute "UPDATE tiles SET type='VendorCategory'"
    execute "INSERT INTO tiles (id, type, name, order_number, created_at, updated_at) SELECT 20 + id, 'MaintenanceRequestCategory' type, name, order_number, created_at, updated_at FROM maintenance_request_categories"
    execute "UPDATE maintenance_requests SET maintenance_request_category_id = maintenance_request_category_id + 20"
    rename_table :maintenance_request_categories, :z_old_maintenance_request_categories

    MoveInChecklistItem.create({order_number: 1, name: 'Security Deposit Received'})
    MoveInChecklistItem.create({order_number: 2, name: 'Employment Verification'})
    MoveInChecklistItem.create({order_number: 3, name: 'Landlord Verification'})
    MoveInChecklistItem.create({order_number: 4, name: 'Verified Identity'})
    MoveInChecklistItem.create({order_number: 5, name: 'Deposit Paid'})
    MoveInChecklistItem.create({order_number: 6, name: 'Lease Executed'})
    MoveInChecklistItem.create({order_number: 7, name: 'First Month\'s Rent Paid'})

    MoveOutChecklistItem.create({order_number: 1, name: "Unit Inspected"})
    MoveOutChecklistItem.create({order_number: 2, name: "Sent Final Account Statement"})
    MoveOutChecklistItem.create({order_number: 3, name: "Received Forwarding Address"})
    MoveOutChecklistItem.create({order_number: 4, name: "Security Deposit Returned"})
    MoveOutChecklistItem.create({order_number: 5, name: "Keys Returned"})
  end
end
