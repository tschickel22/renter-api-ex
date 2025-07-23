class CreatePropertyOwnerships < ActiveRecord::Migration[6.1]
  def change
    create_table :property_ownerships do |t|
      t.integer :property_id, index: true
      t.integer :property_owner_id, index: true
      t.decimal :percentage, precision: 5, scale: 2

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
