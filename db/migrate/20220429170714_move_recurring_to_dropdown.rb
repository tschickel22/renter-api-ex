class MoveRecurringToDropdown < ActiveRecord::Migration[6.1]
  def change
    change_column :maintenance_requests, :recurring, :string
    rename_column :maintenance_requests, :recurring, :recurring_frequency

    execute "UPDATE maintenance_requests SET recurring_frequency = 'monthly' WHERE recurring_frequency = '1'"
    execute "UPDATE maintenance_requests SET recurring_frequency = null WHERE recurring_frequency = '0'"
  end
end
