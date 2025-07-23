class AddFieldsToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :encrypted_tax_id, :string, after: :affiliate_click_code
    add_column :companies, :encrypted_tax_id_iv, :string, after: :encrypted_tax_id
    add_column :companies, :tax_id_type, :string, after: :encrypted_tax_id_iv
  end
end
