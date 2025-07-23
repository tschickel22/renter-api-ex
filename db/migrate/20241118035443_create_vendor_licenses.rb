class CreateVendorLicenses < ActiveRecord::Migration[6.1]
  def change
    create_table :vendor_licenses do |t|
      t.integer :vendor_id, index: true
      t.integer :license_type_id
      t.date :effective_on
      t.date :expires_on
      t.string :license_number
      t.string :issuing_agency

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
