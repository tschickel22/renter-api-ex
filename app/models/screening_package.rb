class ScreeningPackage < ApplicationRecord
  serialize :state_exclusion_list, Array

  DEFAULT_PACKAGE_ID = 1

  def self.private_fields
    [:id, :name, :price, :has_credit_score, :has_criminal_report, :has_full_credit_report, :has_eviction_report, :has_income_report, :external_screening_id]
  end

  def to_builder
    Jbuilder.new do |json|
      ScreeningPackage.private_fields().each do | field |
        json.(self, field)
      end
    end
  end
end

