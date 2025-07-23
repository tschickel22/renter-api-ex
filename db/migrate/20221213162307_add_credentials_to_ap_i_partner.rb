class AddCredentialsToApIPartner < ActiveRecord::Migration[6.1]
  def change
    add_column :api_partners, :encrypted_credentials, :text, after: :partner_type
    add_column :api_partners, :encrypted_credentials_iv, :string, after: :encrypted_credentials
  end
end
