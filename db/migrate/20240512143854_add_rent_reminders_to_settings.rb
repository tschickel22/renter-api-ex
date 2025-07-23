class AddRentRemindersToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :rent_reminder_emails, :boolean, default: false

    execute "UPDATE settings SET rent_reminder_emails = 1 WHERE company_id is NOT NULL"
  end
end
