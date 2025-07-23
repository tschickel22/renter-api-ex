class AddTrashedAtToCommunications < ActiveRecord::Migration[6.1]
  def change
    add_column :communications, :trashed_at, :datetime, after: :updated_at
    execute "UPDATE communications SET trashed_at = deleted_at, deleted_at = null WHERE deleted_at IS NOT NULL"
  end
end
