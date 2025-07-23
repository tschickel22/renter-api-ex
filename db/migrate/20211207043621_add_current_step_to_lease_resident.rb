class AddCurrentStepToLeaseResident < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :current_step, :string, after: :type
  end
end
