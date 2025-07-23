class CreateBulkCharges < ActiveRecord::Migration[6.1]
  def change
    create_table :bulk_charges do |t|
      t.string "hash_id"
      t.integer "company_id", index: true
      t.integer "property_id", index: true
      t.string "frequency"
      t.integer "charge_type_id"
      t.date "due_on"
      t.date "end_on"
      t.decimal "amount", precision: 10, scale: 2
      t.string "description"
      t.boolean "same_for_all"
      t.boolean "prorated"
      t.datetime "deactivated_at"
      t.timestamps
    end
  end
end
