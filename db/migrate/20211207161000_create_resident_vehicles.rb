class CreateResidentVehicles < ActiveRecord::Migration[6.1]
  def change
    create_table :resident_vehicles do |t|
      t.integer :resident_id, index: true
      t.string :make
      t.string :model
      t.integer :year
      t.string :encrypted_plate_number
      t.string :encrypted_plate_number_iv

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
