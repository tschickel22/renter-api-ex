class CreateVendorCategories < ActiveRecord::Migration[6.1]
  def change
    create_table :vendor_categories do |t|
      t.string :name
      t.integer :company_id, index: true
      t.integer :order_number
      t.timestamps
      t.datetime :deleted_at
    end

    VendorCategory.create(name: "HVAC", order_number: 1)
    VendorCategory.create(name: "Electrical", order_number: 2)
    VendorCategory.create(name: "Plumbing", order_number: 3)
    VendorCategory.create(name: "Landscape", order_number: 4)
    VendorCategory.create(name: "Painting", order_number: 5)
    VendorCategory.create(name: "Cleaning", order_number: 6)
    VendorCategory.create(name: "Roofing", order_number: 7)

  end
end
