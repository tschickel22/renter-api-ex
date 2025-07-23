class CreateVendors < ActiveRecord::Migration[6.1]
  def change
    create_table :vendors do |t|
      t.integer :company_id, index: true
      t.string :name
      t.string :email
      t.string :phone_number

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
