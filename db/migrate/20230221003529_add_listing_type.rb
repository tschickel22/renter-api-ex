class AddListingType < ActiveRecord::Migration[6.1]
  def change
    add_column :unit_listings, :listing_type, :string, after: :hash_id
    add_column :unit_listings, :status, :string, after: :hash_id
    add_column :unit_listings, :name, :string, after: :hash_id
  end
end
