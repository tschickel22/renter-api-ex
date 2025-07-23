class CreateCommunications < ActiveRecord::Migration[6.1]
  def change
    create_table :communications do |t|
      t.string :type
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :resident_id, index: true
      t.integer :from_id
      t.string :from_type
      t.integer :to_id
      t.string :to_type
      t.datetime :read_at
      t.longtext :body
      t.integer :related_object_id
      t.string :related_object_type

      t.timestamps
      t.datetime :deleted_at
    end

    add_index :communications, [:from_id, :from_type]
    add_index :communications, [:to_id, :to_type]
    add_index :communications, [:related_object_id, :related_object_type], name: 'related_object_communications'
  end
end
