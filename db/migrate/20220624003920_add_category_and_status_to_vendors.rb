class AddCategoryAndStatusToVendors < ActiveRecord::Migration[6.1]
  def change
    add_column :vendors, :vendor_category_id, :integer, index: true, after: :phone_number
    add_column :vendors, :status, :string, after: :phone_number
    add_column :vendors, :street, :string, after: :phone_number
    add_column :vendors, :city, :string, after: :street
    add_column :vendors, :state, :string, after: :city
    add_column :vendors, :zip, :string, after: :state
  end
end
