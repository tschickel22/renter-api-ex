class AddVendorCompletedOnToMRs < ActiveRecord::Migration[6.1]
  def change
    add_column :maintenance_requests, :vendor_completed_on, :date, after: :submitted_on
  end
end
