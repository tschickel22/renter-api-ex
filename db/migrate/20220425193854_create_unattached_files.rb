class CreateUnattachedFiles < ActiveRecord::Migration[6.1]
  def change
    create_table :unattached_file_batches do |t|
      t.integer :company_id
      t.integer :user_id
      t.string :object_type, index: true
      t.bigint :batch_number, index: true

      t.timestamps
    end
  end
end
