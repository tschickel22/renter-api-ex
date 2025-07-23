class CompanyPayment < Payment

  def self.for_user(current_user)
    CompanyPayment.where(lease: Lease.for_user(current_user))
  end

  def self.new_for_lease_resident(lease_resident)
    payment = CompanyPayment.new
    payment.company_id = lease_resident.lease.company_id
    payment.property_id = lease_resident.lease.property_id
    payment.lease_id = lease_resident.lease_id
    payment.resident_id = lease_resident.resident_id
    return payment
  end
end

