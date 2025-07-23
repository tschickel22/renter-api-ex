class ChangeFloorPlanIdToFloorPlanName < ActiveRecord::Migration[6.1]
  def change
    change_column :units, :floor_plan_id, :string
    rename_column :units, :floor_plan_id, :floor_plan_name
  end
end
