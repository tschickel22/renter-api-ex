class DataMover
  include ApplicationHelper

  def self.copy_property(old_property_id, new_name)
    new_property = nil

    ActiveRecord::Base.transaction do
      new_property = DataMover.copy_object(Property, :id, old_property_id,  {name: new_name}, [:company_id, :status]).first

      if new_property.present?
        DataMover.copy_object(Setting, :property_id, old_property_id,  {property_id: new_property.id}, [:company_id])
        DataMover.copy_object(BankAccount, :property_id, old_property_id,  {property_id: new_property.id}, [:company_id, :external_id, :account_id])
        DataMover.copy_object(PropertyOwnership, :property_id, old_property_id,  {property_id: new_property.id})
        DataMover.copy_object(PropertyListing, :property_id, old_property_id,  {property_id: new_property.id})
        DataMover.copy_object(UnitListing, :property_id, old_property_id,  {property_id: new_property.id})
        # NOT SUPPORTED YET DataMover.copy_object(UnitListingPhoto, :property_id, old_property_id,  {property_id: new_property.id})
      end
    end

    return new_property
  end

  def self.copy_object(klass, key, old_id, new_attrs, private_fields_to_copy = [])
    old_objects = klass.where(key => old_id)
    new_objects = []

    if !old_objects.empty?
      old_objects.each do | old_object |
      new_objects << klass.create(old_object.slice(klass.public_fields() + private_fields_to_copy).merge(new_attrs))
      end
    end

    return new_objects
  end

  def self.move_unit_to_new_property(unit_id, new_property_id)

    ActiveRecord::Base.transaction do

      unit = Unit.find(unit_id)
      old_property_id = unit.property_id

      # Make sure this is in the same company
      new_property = Property.find(new_property_id)

      if new_property.company_id != new_property.company_id
        raise "Cannot move unit to new company"
      end

      unit.update({property_id: new_property_id})

      AccountEntry.where(unit_id: unit.id).update({property_id: new_property_id})
      ExpensePropertySplit.where(unit_id: unit.id).update({property_id: new_property_id})
      JournalEntry.where(unit_id: unit.id).update({property_id: new_property_id})
      MaintenanceRequest.where(unit_id: unit.id).update({property_id: new_property_id})
      UnitListing.where(unit_id: unit.id).update({property_id: new_property_id})

      Lease.where(unit_id: unit.id).each do | lease |
        lease.update({property_id: new_property_id})
        Charge.where(lease_id: lease.id).update({property_id: new_property_id})
        LedgerItem.where(lease_id: lease.id).update({property_id: new_property_id})
        Payment.where(lease_id: lease.id).update({property_id: new_property_id})
        PaymentReturn.where(lease_id: lease.id).update({property_id: new_property_id})
        ScreeningRequest.where(lease_id: lease.id).update({property_id: new_property_id})

        LeaseResident.where(lease_id: lease.id).each do | lease_resident |
          Communication.where(resident_id: lease_resident.resident_id).update({property_id: new_property_id})
        end
      end

      # Update all property stats
      oldest_property_stats = PropertyStat.where(property_id: old_property_id).order(:report_date).first

      months_ago = (PaymentService.todays_date.beginning_of_month.year * 12 + PaymentService.todays_date.beginning_of_month.month) - (oldest_property_stats.report_date.year * 12 + oldest_property_stats.report_date.month)

      (0..months_ago).each do | month_back|
        PopulatePropertyStats.perform(month_back, [new_property_id, old_property_id])
      end
    end
  end
end