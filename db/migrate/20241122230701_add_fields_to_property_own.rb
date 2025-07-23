class AddFieldsToPropertyOwn < ActiveRecord::Migration[6.1]
  def change
    add_column :property_owners, :email, :string, after: :name
    add_column :property_owners, :phone_number, :string, after: :email
    add_column :property_owners, :street, :string, after: :phone_number
    add_column :property_owners, :street_2, :string, after: :street
    add_column :property_owners, :city, :string, after: :street_2
    add_column :property_owners, :state, :string, after: :city
    add_column :property_owners, :zip, :string, after: :state

    add_column :property_owners, :billing_same_as_shipping, :boolean, default: true, after: :zip
    add_column :property_owners, :billing_street, :string, after: :billing_same_as_shipping
    add_column :property_owners, :billing_street_2, :string, after: :billing_street
    add_column :property_owners, :billing_city, :string, after: :billing_street_2
    add_column :property_owners, :billing_state, :string, after: :billing_city
    add_column :property_owners, :billing_zip, :string, after: :billing_state

    add_column :property_owners, :legal_business_dba, :string, after: :name
    add_column :property_owners, :tax_classification, :string, after: :legal_business_dba
    add_column :property_owners, :encrypted_tax_id, :string, after: :legal_business_dba
    add_column :property_owners, :encrypted_tax_id_iv, :string, after: :encrypted_tax_id
    add_column :property_owners, :tax_id_type, :string, after: :encrypted_tax_id_iv

    add_column :property_owners, :generate_1099, :boolean, after: :tax_id_type

  end
end
