class CreateLeases < ActiveRecord::Migration[6.1]
  def change
    create_table :leases do |t|
      t.string :hash_id
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :unit_id, index: true
      t.string :status
      t.date :lease_start_on
      t.date :lease_end_on
      t.date :move_in_on
      t.date :move_out_on
      t.decimal :rent
      t.decimal :security_deposit

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
