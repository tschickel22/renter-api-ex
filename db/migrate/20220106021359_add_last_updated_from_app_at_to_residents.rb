class AddLastUpdatedFromAppAtToResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :last_update_from_app_at, :datetime, after: :deleted_at
  end
end
