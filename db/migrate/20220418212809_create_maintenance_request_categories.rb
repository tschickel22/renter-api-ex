class CreateMaintenanceRequestCategories < ActiveRecord::Migration[6.1]
  def change
    create_table :maintenance_request_categories do |t|
      t.string :name
      t.integer :order_number

      t.timestamps
      t.datetime :deleted_at
    end

    MaintenanceRequestCategory.create(name: "Electrical", order_number: 1)
    MaintenanceRequestCategory.create(name: "HVAC", order_number: 2)
    MaintenanceRequestCategory.create(name: "Maintenance", order_number: 3)
    MaintenanceRequestCategory.create(name: "Other", order_number: 6)
    MaintenanceRequestCategory.create(name: "Plumbing", order_number: 4)
    MaintenanceRequestCategory.create(name: "Service", order_number: 5)
  end
end
