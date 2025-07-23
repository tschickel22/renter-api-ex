class CreateUnits < ActiveRecord::Migration[6.1]
  def change
    create_table :units do |t|
      t.integer :property_id, index: true
      t.string :unit_number
      t.integer :floor_plan_id
      t.integer :beds
      t.decimal :baths
      t.integer :square_feet

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
