class PropertyOwner < ParanoidRecord
  include Generate1099Validatable
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :company
  has_many :property_ownerships
  has_many :properties, through: :property_ownerships
  has_many :user_assignments, as: :entity

  OWNER_TYPE_INDIVIDUAL = 'individual'
  OWNER_TYPE_COMPANY = 'company'
  OWNER_TYPE_OPTIONS = {PropertyOwner::OWNER_TYPE_INDIVIDUAL => 'Individual', PropertyOwner::OWNER_TYPE_COMPANY => 'Company'}

  validates :name, presence: true
  validates :owner_type, presence: true

  validates :phone_number, presence: true, format: { with:  /\A\d{3}-\d{3}-\d{4}\z/, message: "must be a valid phone number" }, if: :generate_1099
  validates :email, presence: true, if: :generate_1099

  attr_encrypted :tax_id, key: Rails.application.credentials.dig(:renter_insight_field_key)

  def self.for_user(current_user)
    if current_user && current_user.is_resident?
      PropertyOwner.where("1=0") # TBD
    elsif current_user && current_user.is_company_user_at_least?
      PropertyOwner.where(company_id: current_user.company_id)
    elsif current_user && current_user.is_admin?
      PropertyOwner.where("1=1")
    else
      PropertyOwner.where("1=0")
    end
  end

  def self.public_fields
    [:id, :name, :owner_type, :email, :phone_number, :street, :street_2, :city, :state, :zip,
     :billing_same_as_shipping, :billing_street, :billing_street_2, :billing_city, :billing_state, :billing_zip,
     :legal_business_dba, :tax_classification, :tax_id, :tax_id_type, :generate_1099]
  end

  def self.private_fields
    [:company_id, :tax_classification_pretty]
  end

  def to_builder
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

      json.property_count property_ownerships.filter{|po| po.property.status = Property::STATUS_ACTIVE}.collect{|po| po.property_id}.uniq.count
    end
  end
end
