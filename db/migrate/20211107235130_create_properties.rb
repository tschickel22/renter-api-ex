class CreateProperties < ActiveRecord::Migration[6.1]
  def change
    create_table :properties do |t|
      t.string :name
      t.integer :company_id, index: true
      t.string :street
      t.string :city
      t.string :state
      t.string :zip
      t.boolean :is_single_unit
      t.string :property_type

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
