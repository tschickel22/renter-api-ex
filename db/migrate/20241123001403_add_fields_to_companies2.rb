class AddFieldsToCompanies2 < ActiveRecord::Migration[6.1]
  def change

    add_column :companies, :billing_same_as_shipping, :boolean, default: true, after: :zip
    add_column :companies, :billing_street, :string, after: :billing_same_as_shipping
    add_column :companies, :billing_street_2, :string, after: :billing_street
    add_column :companies, :billing_city, :string, after: :billing_street_2
    add_column :companies, :billing_state, :string, after: :billing_city
    add_column :companies, :billing_zip, :string, after: :billing_state

    add_column :companies, :generate_1099, :boolean, after: :tax_id_type
  end
end
