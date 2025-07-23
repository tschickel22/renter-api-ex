class AddPropertyIdToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :property_id, :integer, index:true, after: :company_id
  end
end
