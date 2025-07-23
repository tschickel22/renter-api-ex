class AddCheckPrintingSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :check_printing_enabled, :boolean, default: true
    add_column :settings, :check_format, :string
    add_column :settings, :check_signature_heading, :string
    add_column :settings, :check_aba_fractional_number, :string
    add_column :settings, :check_bank_name, :string
    add_column :settings, :check_bank_city, :string
    add_column :settings, :check_bank_state, :string
    add_column :settings, :check_signor_name, :string
  end
end
