class AddLatLonToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :lat, :decimal, precision: 10, scale: 6, after: :zip
    add_column :properties, :lng, :decimal, precision: 10, scale: 6, after: :lat

    Property.all.each do | property |
      property.ensure_geocoding
    end
  end
end
