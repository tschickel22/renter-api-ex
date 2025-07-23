class CreateLeadInfos < ActiveRecord::Migration[6.1]
  def change
    create_table :lead_infos do |t|
      t.integer :company_id, index: true
      t.integer :lease_resident_id, index: true
      t.integer :beds
      t.integer :baths
      t.integer :square_feet
      t.integer :lead_source_id, index: true
      t.date :move_in_on
      t.text :notes

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
