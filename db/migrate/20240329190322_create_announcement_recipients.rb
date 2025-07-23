class CreateAnnouncementRecipients < ActiveRecord::Migration[6.1]
  def change
    create_table :announcement_recipients do |t|
      t.integer :announcement_id, index: true
      t.integer :company_id
      t.integer :recipient_id # company_id, property_id, resident_id
      t.string :recipient_type
      t.string :recipient_conditions
      t.timestamps
    end
  end
end
