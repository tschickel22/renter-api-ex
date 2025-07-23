class AddAgreementToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :agreement_at, :datetime
    add_column :users, :agreement_ip_address, :string
    add_column :users, :cell_phone, :string, after: :email
  end
end
