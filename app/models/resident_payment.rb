class ResidentPayment < Payment

  def resident_full_name
    return resident.full_name if resident.present?
    return lease.primary_resident.resident.full_name
  end

  def self.for_user(current_user)
    ResidentPayment.where(lease: Lease.for_user(current_user))
  end

  def self.new_for_lease_resident(lease_resident)
    payment = ResidentPayment.new
    payment.company_id = lease_resident.lease.company_id
    payment.property_id = lease_resident.lease.property_id
    payment.lease_id = lease_resident.lease_id
    payment.resident_id = lease_resident.resident_id
    return payment
  end
end

