class MoveCheckPrintingConfigurationToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :check_printing_enabled, :boolean, default: false
    add_column :bank_accounts, :check_format, :string
    add_column :bank_accounts, :check_signature_heading, :string
    add_column :bank_accounts, :check_aba_fractional_number, :string
    add_column :bank_accounts, :check_bank_name, :string
    add_column :bank_accounts, :check_bank_city, :string
    add_column :bank_accounts, :check_bank_state, :string
    add_column :bank_accounts, :check_signor_name, :string

    add_column :bank_accounts, :check_company_name, :string
    add_column :bank_accounts, :check_company_street, :string
    add_column :bank_accounts, :check_company_city, :string
    add_column :bank_accounts, :check_company_state, :string
    add_column :bank_accounts, :check_company_zip, :string
    add_column :bank_accounts, :check_company_phone, :string

    Setting.where(check_printing_enabled: true).each do | setting |
      BankAccount.where(company_id: setting.company_id, property_id: nil).each do | bank_account |
        bank_account.check_printing_enabled = setting.check_printing_enabled
        bank_account.check_format = setting.check_format
        bank_account.check_signature_heading = setting.check_signature_heading
        bank_account.check_aba_fractional_number = setting.check_aba_fractional_number
        bank_account.check_bank_name = setting.check_bank_name
        bank_account.check_bank_city = setting.check_bank_city
        bank_account.check_bank_state = setting.check_bank_state
        bank_account.check_signor_name = setting.check_signor_name
        bank_account.check_company_name = setting.check_company_name
        bank_account.check_company_street = setting.check_company_street
        bank_account.check_company_city = setting.check_company_city
        bank_account.check_company_state = setting.check_company_state
        bank_account.check_company_zip = setting.check_company_zip
        bank_account.check_company_phone = setting.check_company_phone
        bank_account.save(validate: false)
      end
    end

    remove_column :settings, :check_format
    remove_column :settings, :check_signature_heading
    remove_column :settings, :check_aba_fractional_number
    remove_column :settings, :check_bank_name
    remove_column :settings, :check_bank_city
    remove_column :settings, :check_bank_state
    remove_column :settings, :check_signor_name

    remove_column :settings, :check_company_name
    remove_column :settings, :check_company_street
    remove_column :settings, :check_company_city
    remove_column :settings, :check_company_state
    remove_column :settings, :check_company_zip
    remove_column :settings, :check_company_phone
  end
end
