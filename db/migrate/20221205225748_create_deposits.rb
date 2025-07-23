class CreateDeposits < ActiveRecord::Migration[6.1]
  def change
    create_table :deposits do |t|
      t.integer :company_id, index: true
      t.integer :api_partner_id, index: true
      t.date :deposit_on
      t.string :external_id
      t.integer :transaction_count
      t.string :account_number
      t.decimal :amount, precision: 12, scale: 2
      t.timestamps
    end

    execute "ALTER TABLE deposits AUTO_INCREMENT = 400001"
  end
end
