class AddSubmittedByToMaintenanceRequests < ActiveRecord::Migration[6.1]
  def change
    add_column :maintenance_requests, :submitted_by_id, :integer, after: :resident_id, index: true
  end
end
