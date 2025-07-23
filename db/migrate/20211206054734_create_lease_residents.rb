class CreateLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    create_table :lease_residents do |t|
      t.integer :lease_id, index: true
      t.integer :resident_id, index: true
      t.string :type

      t.timestamps
    end
  end
end
