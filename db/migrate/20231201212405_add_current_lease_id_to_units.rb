class AddCurrentLeaseIdToUnits < ActiveRecord::Migration[6.1]
  def change
    add_column :units, :current_lease_id, :integer, after: :status

    Unit.all.each do | unit |
      unit.update_status
    end
  end
end
