class CompanyTaxpayerInfo < PermanentRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  TAX_CLASSIFICATION_OPTIONS = {"sole" => "Individual/sole proprietor or single-member LLC", "c_corp" =>"C Corporation", "s_corp" =>"S Corporation", "partnership" =>"Partnership", "trust" =>"Trust/estate", "llc" =>"Limited liability company", "other" =>"Other"}

  attr_encrypted :ssn, key: Rails.application.credentials.dig(:renter_insight_field_key)
  attr_encrypted :ein, key: Rails.application.credentials.dig(:renter_insight_field_key)
  belongs_to :company

  validates :company_id, presence: true
  validates :name, presence: true
  validates :tax_classification, presence: true
  validates :llc_tax_classification, presence: true, if: :llc_tax_classification_selected
  validates :other_tax_classification, presence: true, if: :other_tax_classification_selected
  validates :street, presence: true
  validates :city_state_zip, presence: true
  validate :tax_id_entered
  validates :signature, presence: true

  def llc_tax_classification_selected
    tax_classification == "llc"
  end

  def other_tax_classification_selected
    tax_classification == "other"
  end

  def tax_id_entered
    if ssn.blank? && tax_classification == "sole"
      errors.add(:ssn, "You must enter a Social Security Number")
    elsif ein.blank? && tax_classification != "sole"
      errors.add(:ein, "You must enter an Employer Identification Number")
    elsif !ssn.blank? && !ein.blank?
      errors.add(:ssn, "You must cannot enter a Social Security Number *and* an Employer Identification Number")
      errors.add(:ein, "You must cannot enter a Social Security Number *and* an Employer Identification Number")
    end
  end

  def self.public_fields
    [:name, :business_name, :tax_classification, :llc_tax_classification, :other_tax_classification, :exempt_payee_code, :exempt_from_facta, :street, :city_state_zip, :requesters_name_and_address, :account_numbers, :ssn, :ein, :signature]
  end

  def to_builder()
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end


