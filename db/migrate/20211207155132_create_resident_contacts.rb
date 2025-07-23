class CreateResidentContacts < ActiveRecord::Migration[6.1]
  def change
    create_table :resident_contacts do |t|
      t.integer :resident_id, index: true
      t.string :first_name
      t.string :last_name
      t.string :type
      t.string :relationship_type
      t.string :phone_number

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
