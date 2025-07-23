class UpdateAnnouncement < ActiveRecord::Migration[6.1]
  def change
    remove_column :announcements, :display_on_portal
    rename_column :announcements, :display_until, :send_on
  end
end
