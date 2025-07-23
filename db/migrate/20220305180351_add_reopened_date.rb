class AddReopenedDate < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :screening_reopened_at, :datetime, after: :identity_verification_failed_at
  end
end
