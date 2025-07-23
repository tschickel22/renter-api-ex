class AddInvitationSentAtToLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :invitation_sent_at, :datetime, after: :updated_at
  end
end
