class AddFieldsToVendors < ActiveRecord::Migration[6.1]
  def change

    add_column :vendors, :street_2, :string, after: :street

    add_column :vendors, :billing_same_as_shipping, :boolean, default: true, after: :zip
    add_column :vendors, :billing_street, :string, after: :billing_same_as_shipping
    add_column :vendors, :billing_street_2, :string, after: :billing_street
    add_column :vendors, :billing_city, :string, after: :billing_street_2
    add_column :vendors, :billing_state, :string, after: :billing_city
    add_column :vendors, :billing_zip, :string, after: :billing_state

    add_column :vendors, :legal_business_dba, :string, after: :vendor_category_id
    add_column :vendors, :tax_classification, :string, after: :legal_business_dba
    add_column :vendors, :encrypted_tax_id, :string, after: :legal_business_dba
    add_column :vendors, :encrypted_tax_id_iv, :string, after: :encrypted_tax_id
    add_column :vendors, :tax_id_type, :string, after: :encrypted_tax_id_iv

    add_column :vendors, :generate_1099, :boolean, after: :tax_id_type

  end
end
