class AddTimeZoneAndAnnouncementFields < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :time_zone, :string, default: "Mountain Time (US & Canada)"

    add_column :announcements, :mediums, :string, after: :body
    add_column :announcements, :send_when, :string, after: :mediums, default: 'immediately'
    change_column :announcements, :send_on, :datetime
    rename_column :announcements, :send_on, :send_at
  end
end
