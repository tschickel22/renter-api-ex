class CreateMaintenanceRequests < ActiveRecord::Migration[6.1]
  def change
    create_table :maintenance_requests do |t|
      t.string :hash_id, unique: true
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :unit_id, index: true
      t.integer :resident_id, index: true
      t.integer :maintenance_request_category_id, index: true
      t.string :title
      t.text :description
      t.string :status
      t.string :urgency
      t.integer :assigned_to_id, index: true
      t.string :assigned_to_type
      t.date :submitted_on
      t.date :scheduled_on
      t.date :closed_on
      t.boolean :recurring
      t.boolean :permission_to_enter
      t.boolean :pets_in_unit
      t.string :pet_description

      t.timestamps
    end
  end
end
