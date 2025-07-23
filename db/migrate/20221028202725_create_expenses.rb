class CreateExpenses < ActiveRecord::Migration[6.1]
  def change
    create_table :expenses do |t|
      t.integer :company_id, index: true
      t.string :hash_id, index: true
      t.date :expense_on
      t.decimal :amount, precision: 10, scale: 2
      t.integer :vendor_id, index: true
      t.integer :bank_account_id, index: true
      t.integer :maintenance_request_id, index: true

      t.timestamps
    end

    execute "ALTER TABLE expenses AUTO_INCREMENT = 400000"
  end
end
