class CreateCharges < ActiveRecord::Migration[6.1]
  def change
    create_table :charges do |t|
      t.string :hash_id, index: true
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :lease_id, index: true
      t.integer :charge_type_id
      t.string :description
      t.string :frequency
      t.boolean :prorated
      t.decimal :amount, precision: 10, scale: 2

      t.timestamps
    end
  end
end
