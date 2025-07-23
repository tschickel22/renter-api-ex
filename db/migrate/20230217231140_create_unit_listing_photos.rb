class CreateUnitListingPhotos < ActiveRecord::Migration[6.1]
  def change
    create_table :unit_listing_photos do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true

      t.timestamps
    end
  end
end
