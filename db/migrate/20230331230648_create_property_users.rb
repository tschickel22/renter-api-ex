class CreatePropertyUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :property_users do |t|
      t.integer :property_id, index: true
      t.integer :user_id, index: true
      t.timestamps
    end
  end
end
