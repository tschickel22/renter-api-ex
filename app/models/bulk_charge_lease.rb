class BulkChargeLease < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :property
  belongs_to :bulk_charge
  belongs_to :lease

  validates :amount, presence: true, unless: :same_for_all
  validates :description, presence: true, unless: :same_for_all

  def same_for_all
    bulk_charge.same_for_all
  end

  def calculate_amount
    bulk_charge.same_for_all ? bulk_charge.amount : self.amount
  end

  def calculate_description
    bulk_charge.same_for_all ? bulk_charge.description : self.description
  end

  def self.public_fields
    [:amount, :description, :property_id, :lease_id]
  end

  def self.private_fields
    [:id]
  end

  def destroy
    # Find the corresponding charge and delete any future ledger items
    charge = self.lease.resident_charges.where(bulk_charge_id: self.bulk_charge_id).first

    if charge.present?
      self.lease.resident_ledger_items.where(related_object: charge).future.each{|rli| rli.force_destroy}
    end

    super
  end

  def to_builder
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.lease lease.to_builder("skinny").attributes!
      json.resident lease.primary_resident.resident.to_builder("partial").attributes!

      json.property_name lease.property.name if lease&.property&.present?
      json.unit_number_or_street lease.unit.unit_number_or_street if lease&.unit&.present?

    end
  end
end
