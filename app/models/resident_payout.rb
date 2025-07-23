class ResidentPayout < Payment

  def resident_full_name
    return resident.full_name if resident.present?
    return lease.primary_resident.resident.full_name
  end

  def self.for_user(current_user)
    ResidentPayout.where(lease: Lease.for_user(current_user))
  end

  def self.new_for_lease_resident(lease_resident)
    payout = ResidentPayout.new
    payout.company_id = lease_resident.lease.company_id
    payout.property_id = lease_resident.lease.property_id
    payout.lease_id = lease_resident.lease_id
    payout.resident_id = lease_resident.resident_id
    return payout
  end
end

