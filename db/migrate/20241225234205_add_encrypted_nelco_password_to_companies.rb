class AddEncryptedNelcoPasswordToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :nelco_username, :string, after: :generate_1099
    add_column :companies, :encrypted_nelco_password, :string, after: :nelco_username
    add_column :companies, :encrypted_nelco_password_iv, :string, after: :encrypted_nelco_password
  end
end
