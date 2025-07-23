class AddAddressToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :street, :string, after: :external_screening_id
    add_column :companies, :street_2, :string, after: :street
    add_column :companies, :city, :string, after: :street_2
    add_column :companies, :state, :string, after: :city
    add_column :companies, :zip, :string, after: :state
    add_column :companies, :cell_phone, :string, after: :zip
  end
end
