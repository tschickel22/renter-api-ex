class AddInvoiceToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :enable_invoices, :boolean, default: false
    add_column :settings, :invoice_name_type, :string
    add_column :settings, :invoice_custom_name, :string
    add_column :settings, :invoice_custom_street, :string
    add_column :settings, :invoice_custom_city, :string
    add_column :settings, :invoice_custom_state, :string
    add_column :settings, :invoice_custom_zip, :string
  end
end
