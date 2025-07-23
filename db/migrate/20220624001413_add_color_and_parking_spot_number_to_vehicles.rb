class AddColorAndParkingSpotNumberToVehicles < ActiveRecord::Migration[6.1]
  def change
    add_column :resident_vehicles, :color, :string, after: :year
    add_column :resident_vehicles, :parking_spot, :string, after: :color
  end
end
