class CompanyCharge < Charge
  def self.new_for_lease(lease)
    charge = CompanyCharge.new
    charge.company_id = lease.company_id
    charge.property_id =lease.property_id
    charge.lease_id = lease.id
    return charge
  end
end
