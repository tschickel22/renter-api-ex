class CreateUnitListings < ActiveRecord::Migration[6.1]
  def change
    create_table :unit_listings do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :unit_id, index: true
      t.string :hash_id, index: true
      t.decimal :rent, precision: 10, scale: 2
      t.decimal :security_deposit, precision: 10, scale: 2
      t.integer :lease_term
      t.date :available_on
      t.text :description
      t.text :feature_amenities
      t.text :kitchen_amenities
      t.text :outdoor_amenities
      t.text :living_space_amenities
      t.timestamps
    end
  end
end
