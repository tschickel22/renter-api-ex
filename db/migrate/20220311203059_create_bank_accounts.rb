class CreateBankAccounts < ActiveRecord::Migration[6.1]
  def change
    create_table :bank_accounts do |t|
      t.string :hash_id, index: true
      t.integer :company_id, index: true
      t.string :external_id
      t.string :name
      t.string :account_type
      t.string :encrypted_routing_number
      t.string :encrypted_routing_number_iv
      t.string :encrypted_account_number
      t.string :encrypted_account_number_iv

      t.timestamps
    end
  end
end
