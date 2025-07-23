class Insurance < PermanentRecord
  include ApplicationHelper

  has_paper_trail versions: {class_name: "Versions::Lease"}
  before_create :generate_hash

  belongs_to :lease_resident

  attr_accessor :declarations_batch_number
  has_many_attached :declarations

  STATUS_NEW = 'new'
  STATUS_ACTIVE = 'active'
  STATUS_INACTIVE = 'inactive'
  STATUS_OPTIONS = {Insurance::STATUS_NEW => 'New', Insurance::STATUS_ACTIVE => 'Active', Insurance::STATUS_INACTIVE => 'Inactive'}

  validates :company_id, presence: true
  validates :lease_resident_id, presence: true
  validates :api_partner_id, presence: true

  validates :effective_on, presence: true, if: :internal_policy?, unless: :new_record?
  validates :expires_on, presence: true, if: :internal_policy?, unless: :new_record?
  validates :insurance_company_name, presence: true, if: :internal_policy?, unless: :new_record?
  validates :policy_number, presence: true, if: :internal_policy?, unless: :new_record?
  validates :liability_limit, presence: true, if: :internal_policy?, unless: :new_record?
  validates :adults_on_policy, presence: true, if: :internal_policy?, unless: :new_record?
  validates :primary_insured_first_name, presence: true, if: :internal_policy?, unless: :new_record?
  validates :primary_insured_last_name, presence: true, if: :internal_policy?, unless: :new_record?
  validates :primary_insured_street, presence: true, if: :internal_policy?, unless: :new_record?
  validates :primary_insured_city, presence: true, if: :internal_policy?, unless: :new_record?
  validates :primary_insured_state, presence: true, if: :internal_policy?, unless: :new_record?
  validates :primary_insured_zip, presence: true, if: :internal_policy?, unless: :new_record?

  validate :effective_date_correctness, if: :internal_policy?, unless: :new_record?

  def internal_policy?
    api_partner_id == RenterInsightInternalApi::API_PARTNER_ID
  end

  def is_new?
    status.nil? || status == Insurance::STATUS_NEW
  end

  def is_active?
    status == Insurance::STATUS_ACTIVE
  end

  def status_pretty
    label_lookup(status, Insurance::STATUS_OPTIONS)
  end

  def effective_date_correctness
    if effective_on.present? && expires_on.present?
      if effective_on > expires_on
        self.errors.add(:expires_on, "must end after effective date")
      end
    end
  end

  def self.build_for_current_user(current_user, lease, lease_resident)

    insurance = Insurance.new

    insurance.company_id = lease.company_id
    insurance.status = Insurance::STATUS_NEW
    insurance.lease_resident_id = lease_resident.id
    insurance.primary_insured_first_name = current_user.resident.first_name
    insurance.primary_insured_middle_name = current_user.resident.middle_name
    insurance.primary_insured_last_name = current_user.resident.last_name
    insurance.primary_insured_suffix = current_user.resident.suffix
    insurance.primary_insured_street = lease.unit.street
    insurance.primary_insured_unit_number = lease.unit.unit_number
    insurance.primary_insured_city = lease.unit.city
    insurance.primary_insured_state = lease.unit.state
    insurance.primary_insured_zip = lease.unit.zip

    return insurance
  end

  def self.for_user(current_user)
    if current_user
      if current_user.is_resident?
        Insurance.joins(:lease_resident).where(lease_resident: {resident_id: current_user.resident.id})
      else
        Insurance.where(company_id: current_user.company_id)
      end
    else
      Insurance.where("1=0")
    end
  end

  def self.public_fields
    [
      :api_partner_id, :effective_on, :expires_on, :external_id, :insurance_company_name, :policy_number, :liability_limit, :adults_on_policy,
      :primary_insured_first_name, :primary_insured_middle_name, :primary_insured_last_name, :primary_insured_suffix, :primary_insured_street, :primary_insured_unit_number, :primary_insured_city, :primary_insured_state, :primary_insured_zip,
      :status
    ]
  end

  def self.private_fields
    [:id, :hash_id, :lease_resident_id]
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.status_pretty self.status_pretty
    end
  end

  def self.declaration_builder(declaration)
    Jbuilder.new do |json|
      json.id declaration.id
      json.filename declaration.filename.to_s
      json.content_type declaration.content_type
      json.url Rails.application.routes.url_helpers.url_for(declaration)
    end
  end
end

