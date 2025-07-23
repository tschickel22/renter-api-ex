class CreateUnitListingPhotoUnits < ActiveRecord::Migration[6.1]
  def change
    create_table :unit_listing_photo_units do |t|

      t.integer :unit_listing_id, index: true
      t.integer :unit_listing_photo_id, index: true

      t.timestamps
    end
  end
end
