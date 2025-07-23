class CreatePropertyOwners < ActiveRecord::Migration[6.1]
  def change
    create_table :property_owners do |t|
      t.integer :company_id, index: true
      t.string :first_name
      t.string :last_name

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
