class CreateCommunicationLogs < ActiveRecord::Migration[6.1]
  def change
    create_table :communication_logs do |t|
      t.integer :communication_id, index: true
      t.longtext :data

      t.timestamps
    end
  end
end
