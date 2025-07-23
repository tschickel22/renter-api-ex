class MoveScreeningRequestsToLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :screening_requests, :lease_resident_id, :integer, index: true, after: :lease_id

    ScreeningRequest.all.each do | sr |
      if sr.lease&.primary_resident.present?
        sr.update_column(:lease_resident_id, sr.lease&.primary_resident.id)
      end
    end
  end
end
