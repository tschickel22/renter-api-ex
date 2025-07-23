class AddCheckPrintingSettings2 < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :check_company_name, :string
    add_column :settings, :check_company_street, :string
    add_column :settings, :check_company_city, :string
    add_column :settings, :check_company_state, :string
    add_column :settings, :check_company_zip, :string
    add_column :settings, :check_company_phone, :string
  end
end
