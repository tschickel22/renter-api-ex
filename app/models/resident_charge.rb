class ResidentCharge < Charge
  include ApplicationHelper

  def self.new_for_lease(lease)
    charge = ResidentCharge.new
    charge.company_id = lease.company_id
    charge.property_id = lease.property_id
    charge.lease_id = lease.id
    return charge
  end

  def self.new_for_lease_resident(lease_resident)
    return ResidentCharge.new_for_lease(lease_resident.lease)
  end

  def self.create_adjustment(lease, charge_type_id, description, amount)
    credit_charge = ResidentCharge.new_for_lease(lease)
    credit_charge.charge_type_id = charge_type_id
    credit_charge.description = description
    credit_charge.due_on = ResidentCharge.new.todays_date()
    credit_charge.frequency = Charge::FREQUENCY_ONE_TIME
    credit_charge.amount = amount

    if credit_charge.save
      AccountingService.push_to_ledger(credit_charge)
    end
  end

  def self.build_unique_charge_with_description(charge_type_id, description, frequency, lease, amount, due_on = nil, prorated = false, proposed = false)
    unique_charge = ResidentCharge.where({company_id: lease.company_id, property_id: lease.property_id, lease_id: lease.id, charge_type_id: charge_type_id, description: description}).first_or_initialize

    return update_charge(unique_charge, frequency, amount, due_on, prorated, proposed)
  end

  def self.build_unique_charge(charge_type_id, frequency, lease, amount, due_on = nil, prorated = false, proposed = false)
    unique_charge = ResidentCharge.where({company_id: lease.company_id, property_id: lease.property_id, lease_id: lease.id, charge_type_id: charge_type_id}).first_or_initialize

    return update_charge(unique_charge, frequency, amount, due_on, prorated, proposed)
  end

  def self.update_charge(unique_charge, frequency, amount, due_on = nil, prorated = false, proposed = false)
    unique_charge.due_on = due_on || ResidentCharge.new.todays_date()
    unique_charge.frequency = frequency
    unique_charge.prorated = prorated
    unique_charge.proposed = proposed
    unique_charge.amount = amount

    return unique_charge
  end
end
