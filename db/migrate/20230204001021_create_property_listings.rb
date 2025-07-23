class CreatePropertyListings < ActiveRecord::Migration[6.1]
  def change
    create_table :property_listings do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.string :hash_id, index: true
      t.string :pets_allowed
      t.string :laundry_type
      t.string :parking_type
      t.decimal :parking_fee, precision: 10, scale: 2
      t.text :description
      t.text :amenities
      t.text :included_utilities
      t.string :video_url
      t.string :contact_name
      t.string :contact_email
      t.string :contact_phone
      t.string :rental_license_number
      t.date :rental_license_expires_on
      t.text :syndication_partner_ids
      t.string :rent_special_title
      t.date :rent_special_start_on
      t.date :rent_special_end_on
      t.boolean :agreement

      t.timestamps
    end
  end
end
