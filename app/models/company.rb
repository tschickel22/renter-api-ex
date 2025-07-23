class Company < ParanoidRecord
  include Generate1099Validatable
  has_paper_trail versions: {class_name: "Versions::Company"}

  before_create :generate_hash
  after_create :build_default_user_roles

  has_many :users
  has_many :properties
  has_many :user_roles
  has_many :accounts
  has_many :bank_accounts
  has_many :property_owners
  has_one :company_taxpayer_info
  has_many :payment_methods, class_name: "CompanyPaymentMethod"
  has_many_attached :payments_activation_documents
  has_many :documents
  has_many :external_documents

  validates :cell_phone, presence: true, format: { with:  /\A\d{3}-\d{3}-\d{4}\z/, message: "must be a valid phone number" }, if: :generate_1099
  validates :nelco_username, presence: true, if: :tax_reporting_onboarding_completed
  validates :nelco_password, presence: true, if: :tax_reporting_onboarding_completed

  attr_encrypted :tax_id, key: Rails.application.credentials.dig(:renter_insight_field_key)
  attr_encrypted :nelco_password, key: Rails.application.credentials.dig(:renter_insight_field_key)


  HAYS_FAMILY_HOMES = 2630

  FREE_UNIT_THRESHOLD = 20

  PAYMENT_ONBOARDING_STATUS_NEW = 'new'
  PAYMENT_ONBOARDING_STATUS_STARTED = 'started'
  PAYMENT_ONBOARDING_STATUS_AGREEMENT = 'agreement'
  PAYMENT_ONBOARDING_STATUS_TAXPAYER_INFO = 'taxpayer_info'
  PAYMENT_ONBOARDING_STATUS_SUBMITTED = 'submitted'
  PAYMENT_ONBOARDING_STATUS_PROPERTY_ACCOUNTS = 'property_accounts'
  PAYMENT_ONBOARDING_STATUS_COMPLETED = 'completed'
  PAYMENT_ONBOARDING_STATUS_OPTIONS = {Company::PAYMENT_ONBOARDING_STATUS_NEW => 'New', Company::PAYMENT_ONBOARDING_STATUS_STARTED => 'Started', Company::PAYMENT_ONBOARDING_STATUS_AGREEMENT => 'Pending Agreement', Company::PAYMENT_ONBOARDING_STATUS_TAXPAYER_INFO => 'W9', Company::PAYMENT_ONBOARDING_STATUS_SUBMITTED => 'Submitted', Company::PAYMENT_ONBOARDING_STATUS_PROPERTY_ACCOUNTS => 'Setup Property Bank Accounts', Company::PAYMENT_ONBOARDING_STATUS_COMPLETED => 'Completed'}

  LISTINGS_ONBOARDING_STATUS_COMPLETED = 'completed'

  FINANCIAL_CONNECTIONS_ONBOARDING_STATUS_COMPLETED = 'completed'
  FINANCIAL_CONNECTIONS_ONBOARDING_STATUS_OPTIONS = {Company::FINANCIAL_CONNECTIONS_ONBOARDING_STATUS_COMPLETED => 'Completed'}

  TAX_REPORTING_ONBOARDING_STATUS_STARTED = 'started'
  TAX_REPORTING_ONBOARDING_STATUS_PENDING = 'pending'
  TAX_REPORTING_ONBOARDING_STATUS_COMPLETED = 'completed'
  TAX_REPORTING_ONBOARDING_STATUS_OPTIONS = {Company::TAX_REPORTING_ONBOARDING_STATUS_STARTED => 'Started', Company::TAX_REPORTING_ONBOARDING_STATUS_PENDING => 'Pending', Company::TAX_REPORTING_ONBOARDING_STATUS_COMPLETED => 'Completed'}

  SUBSCRIPTION_FREQUENCY_FREE = 'free'
  SUBSCRIPTION_FREQUENCY_MONTHLY = 'monthly'
  SUBSCRIPTION_FREQUENCY_YEARLY = 'yearly'
  SUBSCRIPTION_FREQUENCY_OPTIONS = {Company::SUBSCRIPTION_FREQUENCY_FREE => 'Free', Company::SUBSCRIPTION_FREQUENCY_MONTHLY => 'Monthly', Company::SUBSCRIPTION_FREQUENCY_YEARLY => 'Yearly'}
  SUBSCRIPTION_PRICING_OPTIONS = {Company::SUBSCRIPTION_FREQUENCY_FREE => '$0.00', Company::SUBSCRIPTION_FREQUENCY_MONTHLY => '$24.95', Company::SUBSCRIPTION_FREQUENCY_YEARLY => '$199'}

  SUBSCRIPTION_STATUS_NEW = 'new'
  SUBSCRIPTION_STATUS_ACTIVE = 'active'
  SUBSCRIPTION_STATUS_INACTIVE = 'inactive'
  SUBSCRIPTION_STATUS_CANCELLED= 'cancelled'
  SUBSCRIPTION_STATUS_OPTIONS = {Company::SUBSCRIPTION_STATUS_NEW => 'New', Company::SUBSCRIPTION_STATUS_ACTIVE => 'Active', Company::SUBSCRIPTION_STATUS_INACTIVE => 'Inactive', Company::SUBSCRIPTION_STATUS_CANCELLED => 'Cancelled'}

  attr_accessor :company_action

  accepts_nested_attributes_for :bank_accounts

  validates :name, presence: true
  validates :cell_phone, presence: true, if: :is_activating_screening
  validates :street, presence: true, if: :is_activating_screening_or_payments
  validates :city, presence: true, if: :is_activating_screening_or_payments
  validates :state, presence: true, if: :is_activating_screening_or_payments
  validates :zip, presence: true, if: :is_activating_screening_or_payments

  validates :legal_business_name, presence: true, if: :is_onboarding_payments
  validates :year_formed, presence: true, numericality: {greater_than_or_equal_to:  1900}, if: :is_onboarding_payments
  validates :units_managed, presence: true, numericality: {greater_than_or_equal_to:  0}, if: :is_onboarding_payments

  validates :primary_contact_first_name, presence: true, if: :is_onboarding_payments
  validates :primary_contact_last_name, presence: true, if: :is_onboarding_payments
  validates :primary_contact_title, presence: true, if: :is_onboarding_payments
  validates :primary_contact_phone, presence: true, if: :is_onboarding_payments
  validates :primary_contact_email, presence: true, if: :is_onboarding_payments

  validates :default_resident_responsible_fee_ach, inclusion: [false, true], if: :is_onboarding_payments_for_taxpayer_info
  validates :default_resident_responsible_fee_credit_card, inclusion: [false, true], if: :is_onboarding_payments_for_taxpayer_info
  validates :default_resident_responsible_fee_debit_card, inclusion: [false, true], if: :is_onboarding_payments_for_taxpayer_info
  validates :consolidated_1099, inclusion: [false, true], if: :is_onboarding_payments_for_taxpayer_info
  validate :agreement_signature_matches, if: :is_onboarding_payments_for_taxpayer_info

  def is_activating_screening
    company_action == "screening-activation"
  end

  def is_onboarding_payments
    company_action == "payments-onboarding"
  end

  def is_onboarding_payments_for_taxpayer_info
    is_onboarding_payments && payments_onboard_status == Company::PAYMENT_ONBOARDING_STATUS_TAXPAYER_INFO
  end

  def is_onboarding_payments_for_submittal
    is_onboarding_payments && payments_onboard_status == Company::PAYMENT_ONBOARDING_STATUS_SUBMITTED
  end

  def is_activating_screening_or_payments
    is_activating_screening || is_onboarding_payments
  end

  def tax_reporting_onboarding_completed
    generate_1099 && self.tax_reporting_onboard_status == Company::TAX_REPORTING_ONBOARDING_STATUS_COMPLETED
  end

  def screening_is_activated?
    !external_screening_id.blank?
  end

  def agreement_signature_matches
    if payments_agreement_signature.nil? || (payments_agreement_signature.gsub(" ", "").downcase != (primary_contact_first_name + primary_contact_last_name).gsub(" ", "").downcase)
      errors.add(:payments_agreement_signature, "does not match representative name")
    end
  end

  def primary_company_admin
    users.where(user_type: User::TYPE_COMPANY_ADMIN).first
  end

  def is_paying?
    subscription_status == Company::SUBSCRIPTION_STATUS_ACTIVE && !subscription_frequency.blank?
  end

  def full_address
    strs = [street]
    strs << city
    strs << "#{state} #{zip}"
    return strs.join(", ")
  end

  def build_default_user_roles
    if user_roles.empty?

      UserRole.create({
                        company_id: self.id,
                        name: UserRole::NAME_COMPANY_ADMIN,
                        user_type: User::TYPE_COMPANY_ADMIN,
                        listings: UserRole::ACCESS_LEVEL_DELETE,
                        screening: UserRole::ACCESS_LEVEL_DELETE,
                        expenses: UserRole::ACCESS_LEVEL_DELETE,
                        payments: UserRole::ACCESS_LEVEL_DELETE,
                        maintenance_requests: UserRole::ACCESS_LEVEL_DELETE,
                        reports: UserRole::ACCESS_LEVEL_DELETE,
                        users: UserRole::ACCESS_LEVEL_DELETE,
                        communications: UserRole::ACCESS_LEVEL_DELETE,
                        properties: UserRole::ACCESS_LEVEL_DELETE,
                        vendors: UserRole::ACCESS_LEVEL_DELETE,
                        settings: UserRole::ACCESS_LEVEL_DELETE,
                        property_owners: UserRole::ACCESS_LEVEL_DELETE,
                        residents: UserRole::ACCESS_LEVEL_DELETE,
                        leasing: UserRole::ACCESS_LEVEL_DELETE,
                        accounting: UserRole::ACCESS_LEVEL_DELETE,
                        lease_docs: UserRole::ACCESS_LEVEL_DELETE
      })

      UserRole.create({
                        company_id: self.id,
                        name: UserRole::NAME_COMPANY_USER,
                        user_type: User::TYPE_COMPANY_USER,
                        communications: UserRole::ACCESS_LEVEL_DELETE,
                        listings: UserRole::ACCESS_LEVEL_EDIT,
                        screening: UserRole::ACCESS_LEVEL_EDIT,
                        payments: UserRole::ACCESS_LEVEL_EDIT,
                        maintenance_requests: UserRole::ACCESS_LEVEL_EDIT,
                        vendors: UserRole::ACCESS_LEVEL_EDIT,
                        residents: UserRole::ACCESS_LEVEL_EDIT,
                        leasing: UserRole::ACCESS_LEVEL_EDIT,
                        reports: UserRole::ACCESS_LEVEL_NONE,
                        users: UserRole::ACCESS_LEVEL_NONE,
                        properties: UserRole::ACCESS_LEVEL_NONE,
                        settings: UserRole::ACCESS_LEVEL_NONE,
                        property_owners: UserRole::ACCESS_LEVEL_NONE,
                        expenses: UserRole::ACCESS_LEVEL_NONE,
                        accounting: UserRole::ACCESS_LEVEL_NONE,
                        lease_docs: UserRole::ACCESS_LEVEL_EDIT
      })

      UserRole.create({
                        company_id: self.id,
                        name: UserRole::NAME_PROPERTY_OWNER,
                        user_type: User::TYPE_COMPANY_USER,
                        listings: UserRole::ACCESS_LEVEL_EDIT,
                        screening: UserRole::ACCESS_LEVEL_EDIT,
                        expenses: UserRole::ACCESS_LEVEL_NONE,
                        payments: UserRole::ACCESS_LEVEL_EDIT,
                        maintenance_requests: UserRole::ACCESS_LEVEL_EDIT,
                        reports: UserRole::ACCESS_LEVEL_NONE,
                        users: UserRole::ACCESS_LEVEL_NONE,
                        communications: UserRole::ACCESS_LEVEL_DELETE,
                        properties: UserRole::ACCESS_LEVEL_NONE,
                        vendors: UserRole::ACCESS_LEVEL_DELETE,
                        settings: UserRole::ACCESS_LEVEL_NONE,
                        property_owners: UserRole::ACCESS_LEVEL_NONE,
                        residents: UserRole::ACCESS_LEVEL_DELETE,
                        leasing: UserRole::ACCESS_LEVEL_DELETE,
                        accounting: UserRole::ACCESS_LEVEL_NONE,
                        lease_docs: UserRole::ACCESS_LEVEL_EDIT
      })

    end
  end

  def deactivate_all_properties
    self.properties.active.each do | property |
      property.deactivate()
    end
  end

  def self.for_user(current_user)
    if current_user && current_user.is_resident?
      Company.where(id: current_user.resident.leases.collect{|l| l.company_id})
    elsif current_user && current_user.is_company_admin? || current_user && current_user.is_company_user?
      Company.where(id: current_user.company_id)
    elsif current_user && current_user.is_admin?
      Company.where("1=1")
    else
      Company.where("1=0")
    end
  end

  def self.public_fields
    [
      :name, :street, :street_2, :city, :state, :zip, :cell_phone, :payments_onboard_status, :listings_onboard_status, :financial_connections_onboard_status,
      :legal_business_name, :legal_business_dba, :year_formed, :units_managed, :number_of_units, :tax_id, :tax_id_type, :tax_reporting_onboard_status,
      :primary_contact_first_name, :primary_contact_last_name, :primary_contact_title, :primary_contact_phone, :primary_contact_email,
      :secondary_contact_first_name, :secondary_contact_last_name, :secondary_contact_title, :secondary_contact_phone, :secondary_contact_email,
      :payments_agreement_at, :payments_agreement_ip_address, :payments_agreement_signature, :use_same_bank_account_for_deposits,
      :default_resident_responsible_fee_ach, :default_resident_responsible_fee_credit_card, :default_resident_responsible_fee_debit_card, :consolidated_1099,
      :subscription_frequency, :billing_same_as_shipping,:billing_street,:billing_street_2,:billing_city,:billing_state,:billing_zip,:generate_1099,
      :nelco_username, :nelco_password, :document_management_active
    ]
  end

  def self.private_fields
    [:id, :hash_id, :external_screening_id, :external_payments_id, :external_crm_id, :subscription_status]
  end

  def to_builder(level = 'full')
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
      json.screening_packages ScreeningPackage.all.collect{|sp| sp.to_builder.attributes! }
      json.bank_accounts self.bank_accounts.collect{|sp| sp.to_builder.attributes! }
      json.payment_methods self.payment_methods.collect{|sp| sp.to_builder.attributes! }
      json.max_number_of_units self.subscription_frequency == Company::SUBSCRIPTION_FREQUENCY_FREE ? 10 : 99999
    end
  end

  def self.payments_activation_document_builder(payments_activation_document)
    Jbuilder.new do |json|
      json.id payments_activation_document.id
      json.filename payments_activation_document.filename.to_s
      json.content_type payments_activation_document.content_type
      json.url Rails.application.routes.url_helpers.url_for(payments_activation_document)
    end
  end
end


