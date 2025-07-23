class CreateAnnouncements < ActiveRecord::Migration[6.1]
  def change
    create_table :announcements do |t|
      t.integer :company_id, index: true
      t.integer :sent_by_user_id, index: true
      t.string :hash_id, index: true
      t.string :status
      t.integer :template_id
      t.string :subject
      t.text :body
      t.boolean :display_on_portal, default: false
      t.date :display_until

      t.datetime :sent_at
      t.timestamps
      t.datetime :deleted_at
    end

    execute "ALTER TABLE announcements AUTO_INCREMENT = 300000"
  end
end
