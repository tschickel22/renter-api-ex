class AddLatLngToUnits < ActiveRecord::Migration[6.1]
  def change
    add_column :units, :lat, :decimal, precision: 10, scale: 6, after: :zip
    add_column :units, :lng, :decimal, precision: 10, scale: 6, after: :lat

    Unit.all.each do | unit |
      unit.ensure_geocoding
    end
  end
end
