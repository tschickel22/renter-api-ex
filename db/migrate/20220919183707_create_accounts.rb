class CreateAccounts < ActiveRecord::Migration[6.1]
  def change
    create_table :accounts do |t|
      t.integer :code
      t.integer :company_id, index: true
      t.integer :account_category_id, index: true
      t.string :name
      t.string :account_type
      t.text :description

      t.timestamps
      t.datetime :deleted_at
    end©
  end
end
