class AddResolutionTimeToMaintReq < ActiveRecord::Migration[6.1]
  def change
    add_column :maintenance_requests, :preferred_resolution_on, :date, after: :scheduled_on
    add_column :maintenance_requests, :preferred_resolution_time, :string, after: :preferred_resolution_on
    add_column :maintenance_requests, :scheduled_time, :string, after: :scheduled_on
  end
end
