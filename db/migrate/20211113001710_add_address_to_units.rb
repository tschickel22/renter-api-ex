class AddAddressToUnits < ActiveRecord::Migration[6.1]
  def change
    add_column :units, :street, :string, after: :unit_number
    add_column :units, :city, :string, after: :street
    add_column :units, :state, :string, after: :city
    add_column :units, :zip, :string, after: :state
  end
end
