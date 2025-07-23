class RenameScreeningCompletedAt < ActiveRecord::Migration[6.1]
  def change
    rename_column :lease_residents, :screening_completed_at, :application_completed_at
  end
end
