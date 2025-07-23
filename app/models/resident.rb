class Resident < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}
  include ActionView::Helpers::NumberHelper
  include ApplicationHelper

  before_create :generate_hash
  after_save :sync_changes_with_user

  belongs_to :user
  belongs_to :property
  has_many :lease_residents
  has_many :leases, through: :lease_residents

  has_many :resident_pets
  has_many :resident_residence_histories
  has_many :resident_employment_histories
  has_many :resident_contact_emergencies
  has_many :resident_contact_references
  has_many :resident_vehicles
  has_many :resident_payment_methods
  has_many :credit_reporting_activities, -> { order(reported_on: :desc)}
  has_many_attached :income_proofs
  has_one_attached :identification_copy
  has_one_attached :identification_selfie
  has_many :external_lease_documents

  accepts_nested_attributes_for :resident_pets
  accepts_nested_attributes_for :resident_residence_histories
  accepts_nested_attributes_for :resident_employment_histories
  accepts_nested_attributes_for :resident_contact_emergencies
  accepts_nested_attributes_for :resident_contact_references
  accepts_nested_attributes_for :resident_vehicles

  attr_accessor :lease_resident_type, :lease_resident_step, :screening_agreement, :app_timestamp, :current_settings

  ID_TYPE_DRIVERS_LICENSE = 'drivers_license'
  ID_TYPE_PASSPORT = 'passport'
  ID_TYPE_GOVERNMENT_ID = 'government_id'
  ID_TYPE_IMMIGRATION_ID_CARD = 'immigration_id_card'
  ID_TYPE_OTHER = 'other'

  SUFFIX_OPTIONS = {"Jr.":"Jr.", "II": "II", "III": "III", "IV": "IV", "Other": "Other"}
  ID_TYPE_OPTIONS = {
    Resident::ID_TYPE_DRIVERS_LICENSE => "State-Issued Driver's License / ID Card",
    Resident::ID_TYPE_PASSPORT => 'Passport',
    Resident::ID_TYPE_GOVERNMENT_ID => 'Military or Government-issued ID',
    Resident::ID_TYPE_IMMIGRATION_ID_CARD => 'Immigration ID Card',
    Resident::ID_TYPE_OTHER => 'Other'
  }

  STATUS_OPTIONS = {"all" => "All", "current" => "Current", "future" => "Future", "former" => "Former", "expiring" => "Expiring", "move_in" => "Move-Ins", "move_out" => "Move-Outs"}

  attr_encrypted :tax_id, key: Rails.application.credentials.dig(:renter_insight_field_key)
  attr_encrypted :date_of_birth, key: Rails.application.credentials.dig(:renter_insight_field_key)
  attr_encrypted :id_card_number, key: Rails.application.credentials.dig(:renter_insight_field_key)

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email, presence: true, if: [:is_screenable?, :on_lead_or_invitation_or_occupant_details_step?]
  validates :phone_number, presence: true, if: [:is_screenable?, :on_occupant_details_step?]
  validates :income, presence: true, numericality: {greater_than_or_equal_to: 0}, if: [:is_screenable?, :on_applicant_details_step?, :income_required]
  validate :two_years_of_residence_history, if: [:is_screenable?, :on_applicant_details_step?, :residence_histories_required]
  validate :two_years_of_employment_history, if: [:is_screenable?, :on_applicant_details_step?, :employment_histories_required]

  validates :id_type, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :identification_required]
  validates :id_issuer, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :identification_required]
  validates :id_card_number, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :identification_required]

  validates :identification_copy, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :identification_copy_required]
  validates :identification_selfie, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :identification_selfie_required]

  validates :tax_id, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :property_will_screen?], unless: :no_tax_id
  validates :date_of_birth, presence: true, if: [:is_screenable?, :on_applicant_details_step?, :property_will_screen?]
  validate :valid_date_of_birth, if: [:is_screenable?, :on_applicant_details_step?, :property_will_screen?]

  validate :screening_agreement, if: [:is_screenable?, :on_screening_step?]

  def name
    full_name
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def two_years_of_residence_history
    # Make sure that the residence histories add up to 2 years
    total_months = resident_residence_histories.inject(0) { | sum, rh | sum + (rh.months_at_address || 0)}

    months_required = 24
    months_required = current_settings.resident_histories_minimum if current_settings.present? && current_settings.resident_histories_minimum > 0

    if total_months < months_required
      errors.add("resident_residence_histories.0.id", "Must provide at least #{label_lookup(months_required, ResidentEmploymentHistory::TIME_AT_OPTIONS).downcase} of history")
    end
  end

  def two_years_of_employment_history
    # Make sure that the residence histories add up to 2 years
    total_months = resident_employment_histories.inject(0) { | sum, rh | sum + (rh.months_at_company || 0)}
    months_required = 24
    months_required = current_settings.employment_histories_minimum if current_settings.present? && current_settings.employment_histories_minimum > 0

    if total_months < months_required
      errors.add("resident_employment_histories.0.id", "Must provide at least #{label_lookup(months_required, ResidentEmploymentHistory::TIME_AT_OPTIONS).downcase} of history")
    end
  end

  def screening_agreement
    errors.add('screening_agreement', 'You must agree to the screening agreement') if screening_agreement_at.nil?
  end

  def valid_date_of_birth
    if self.date_of_birth.present? && (self.date_of_birth < 120.years.ago ||  self.date_of_birth > 15.years.ago)
      errors.add(:date_of_birth, "must be a valid date")
    end
  end

  def is_primary?
    lease_resident_type == LeaseResidentPrimary.to_s
  end

  def is_primary_or_secondary?
    [LeaseResidentPrimary.to_s, LeaseResidentSecondary.to_s].include?(lease_resident_type)
  end

  def is_screenable?
    [LeaseResidentPrimary.to_s, LeaseResidentSecondary.to_s, LeaseResidentGuarantor.to_s].include?(lease_resident_type)
  end

  def property_will_screen?
    property.present? && !property.external_screening_id.blank?
  end

  def on_lead_or_invitation_or_occupant_details_step?
    on_invitation_step? || on_occupant_details_step? || on_lead_step?
  end

  def on_lead_step?
    lease_resident_step == LeaseResident::STEP_LEAD
  end

  def on_invitation_step?
    lease_resident_step == LeaseResident::STEP_INVITATION
  end

  def on_occupant_details_step?
    lease_resident_step == LeaseResident::STEP_OCCUPANT_DETAILS
  end

  def on_applicant_details_step?
    lease_resident_step == LeaseResident::STEP_APPLICANT_DETAILS
  end

  def on_screening_step?
    lease_resident_step == LeaseResident::STEP_SCREENING
  end

  def identification_required
    return current_settings.present? && current_settings.application_include_identification == Setting::REQUIRED
  end

  def identification_selfie_required
    return identification_required && current_settings.present? && ["selfie"].include?(current_settings.additional_identification_evidence)
  end

  def identification_copy_required
    return identification_required && current_settings.present? && ["copy", "selfie"].include?(current_settings.additional_identification_evidence)
  end

  def residence_histories_required
    return current_settings.present? && current_settings.application_include_resident_histories == Setting::REQUIRED
  end

  def employment_histories_required
    return current_settings.present? && current_settings.application_include_employment_histories == Setting::REQUIRED
  end

  def income_required
    return current_settings.present? && current_settings.application_include_income == Setting::REQUIRED
  end

  def self.for_user(current_user)
    Resident.joins(:leases).where(leases: {property: Property.for_user(current_user).active})
  end

  def current_lease
    leases.current.last
  end

  def current_or_future_lease
    leases.current.last || leases.future.last
  end

  def date_of_birth_on
    # Translate date_of_birth string to a date object
    begin
      return date_of_birth if date_of_birth.is_a?(Date) || date_of_birth.is_a?(Time) || date_of_birth.is_a?(DateTime)
      return Date.strptime(self.date_of_birth, '%m/%d/%Y') if self.date_of_birth.include?('/')
      return Date.strptime(date_of_birth, '%Y-%m-%d')
    rescue

    end

    return nil
  end

  def is_18?
    self.date_of_birth_on.present? && self.date_of_birth_on < 18.years.ago
  end

  def eligible_for_credit_reporting?
    has_ssn = (self.tax_id || "").length >= 9

    return has_ssn || self.is_18?
  end

  def self.public_fields
    [:id, :hash_id, :income, :first_name, :middle_name, :last_name, :suffix, :email, :phone_number, :text_opted_out_at, :income_notes, :id_type, :id_issuer, :id_card_number, :tax_id, :no_tax_id, :screening_agreement_at, :credit_builder_status]
  end

  def self.public_fields_with_date_of_birth
    public_fields + [:date_of_birth]
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.set!(field, self.send(field) || "")
      end

      json.name self.name
      json.user_id self.user_id
      json.income number_to_currency(income, precision: 0) if self.income.present?
      json.date_of_birth (self.date_of_birth_on.present? ? self.date_of_birth_on.strftime('%m/%d/%Y') : nil)

      if level == "full"
        json.identification_selfie self.identification_selfie.present?
        json.identification_copy self.identification_copy.present?
        json.resident_payment_methods resident_payment_methods.collect{|rpm| rpm.to_builder.attributes! }
        json.screening_agreement screening_agreement_at.present?
        json.resident_pets (resident_pets ? resident_pets.collect{|rp| rp.to_builder.attributes! } : nil)
        json.resident_residence_histories (resident_residence_histories ? resident_residence_histories.collect{|rp| rp.to_builder.attributes! } : nil)
        json.resident_employment_histories (resident_employment_histories ? resident_employment_histories.collect{|rp| rp.to_builder.attributes! } : nil)
        json.resident_contact_emergencies (resident_contact_emergencies ? resident_contact_emergencies.collect{|rp| rp.to_builder.attributes! } : nil)
        json.resident_contact_references (resident_contact_references ? resident_contact_references.collect{|rp| rp.to_builder.attributes! } : nil)
        json.resident_vehicles (resident_vehicles ? resident_vehicles.collect{|rp| rp.to_builder.attributes! } : nil)
      end
    end
  end

  def self.income_proof_builder(ip)
    Jbuilder.new do |json|
      json.id ip.id
      json.filename ip.filename.to_s
      json.content_type ip.content_type
    end
  end

  private

  def sync_changes_with_user
    # Update the user too
    if self.user.present?
      self.user.skip_confirmation_notification!
      self.user.assign_attributes({ email: self.email, first_name: self.first_name, last_name: self.last_name })
      self.user.save
    end
  end
end