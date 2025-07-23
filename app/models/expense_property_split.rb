class ExpensePropertySplit < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Expense"}

  belongs_to :expense
  belongs_to :company
  belongs_to :property
  belongs_to :unit

  validates :amount, numericality: {greater_than: 0}, presence: true

  def property_name
    if property_id.present?
      property.name
    else
      company.name
    end
  end

  def street_and_unit
    unit.street_and_unit if unit_id.present?
  end

  def self.public_fields
    [:id, :property_id, :unit_id, :amount]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each { | field | json.(self, field) }
    end
  end
end
