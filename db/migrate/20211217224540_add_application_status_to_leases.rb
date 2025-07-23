class AddApplicationStatusToLeases < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :application_status, :string, after: :status
  end
end
