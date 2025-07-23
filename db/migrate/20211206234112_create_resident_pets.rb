class CreateResidentPets < ActiveRecord::Migration[6.1]
  def change
    create_table :resident_pets do |t|
      t.integer :resident_id, index: true
      t.string :name
      t.string :pet_type
      t.string :breed
      t.string :weight
      t.string :color

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
