class Vendor < ParanoidRecord
  include Generate1099Validatable
  include ApplicationHelper
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :company
  has_many :vendor_insurances
  has_many :vendor_licenses

  validates :name, presence: true

  validates :phone_number, presence: true, format: { with:  /\A\d{3}-\d{3}-\d{4}\z/, message: "must be a valid phone number" }, if: :generate_1099
  validates :email, presence: true, if: :generate_1099

  accepts_nested_attributes_for :vendor_insurances, allow_destroy: true
  accepts_nested_attributes_for :vendor_licenses, allow_destroy: true

  attr_encrypted :tax_id, key: Rails.application.credentials.dig(:renter_insight_field_key)

  STATUS_PREFERRED = 'preferred'
  STATUS_SECONDARY = 'secondary'
  STATUS_UNKNOWN = 'unknown'
  STATUS_DO_NOT_USE = 'do_not_use'
  STATUS_OPTIONS = {Vendor::STATUS_PREFERRED => 'Preferred', Vendor::STATUS_SECONDARY => 'Secondary', Vendor::STATUS_UNKNOWN => 'Unknown', Vendor::STATUS_DO_NOT_USE => 'Do Not Use'}

  def self.for_user(current_user)
    if current_user
      Vendor.where(company_id: current_user.company_id)
    else
      Vendor.where("1=0")
    end
  end

  def self.public_fields
    [
      :name, :email, :phone_number, :vendor_category_id, :status, :street, :street_2, :city, :state, :zip,
      :billing_same_as_shipping, :billing_street, :billing_street_2, :billing_city, :billing_state, :billing_zip,
      :legal_business_dba, :tax_classification, :tax_id, :tax_id_type, :generate_1099,
    ]
  end

  def self.private_fields
    [:id, :tax_classification_pretty]
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      if !self.tax_id.blank?
        json.tax_id_masked "XX-#{self.tax_id.slice(-4, 4)}"
      end

      json.vendor_insurances vendor_insurances.collect{|vi| vi.to_builder.attributes!}
      json.vendor_licenses vendor_licenses.collect{|vl| vl.to_builder.attributes!}
    end
  end
end

