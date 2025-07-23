class CreateApiLogs < ActiveRecord::Migration[6.1]
  def change
    create_table :api_logs do |t|

      t.integer :api_partner_id, index: true
      t.integer :company_id, index: true
      t.string :action, index: true
      t.string :url
      t.string :ip_address
      t.string :status
      t.text :request
      t.text :response
      t.float :response_time

      t.timestamps
    end
  end
end
