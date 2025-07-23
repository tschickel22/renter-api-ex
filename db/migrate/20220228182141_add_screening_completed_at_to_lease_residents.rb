class AddScreeningCompletedAtToLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :screening_completed_at, :datetime, after: :invitation_sent_at
    add_column :lease_residents, :identity_verification_failed_at, :datetime, after: :invitation_sent_at
  end
end
