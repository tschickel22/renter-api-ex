class UserRole < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::User"}
  before_create :generate_hash

  ACCESS_LEVEL_NONE = 'none'
  ACCESS_LEVEL_VIEW = 'view'
  ACCESS_LEVEL_EDIT = 'edit'
  ACCESS_LEVEL_DELETE = 'delete'
  ACCESS_LEVEL_OPTIONS = {UserRole::ACCESS_LEVEL_NONE => 'None', UserRole::ACCESS_LEVEL_VIEW => 'View', UserRole::ACCESS_LEVEL_EDIT => 'View / Edit', UserRole::ACCESS_LEVEL_DELETE => 'View / Edit / Delete'}

  NAME_COMPANY_ADMIN = "Company Admin"
  NAME_COMPANY_USER = "Company User"
  NAME_PROPERTY_OWNER = "Property Owner"

  EMAIL_TYPE_SCREENING = "screening"
  EMAIL_TYPE_PAYMENTS = "payments"
  EMAIL_TYPE_LEASING = "leasing"
  EMAIL_TYPE_COMMUNICATIONS = "communications"
  EMAIL_TYPE_MAINTENANCE_REQUESTS = "maintenance_requests"
  EMAIL_TYPE_LISTINGS = "listings" # Not used yet
  EMAIL_TYPE_ALL_COMPANY_ADMINS = "all_company_admins"

  validates :name, presence: true
  validates :user_type, presence: true

  validates :listings, presence: true
  validates :screening, presence: true
  validates :expenses, presence: true
  validates :payments, presence: true
  validates :maintenance_requests, presence: true
  validates :reports, presence: true
  validates :users, presence: true
  validates :communications, presence: true
  validates :properties, presence: true
  validates :vendors, presence: true
  validates :settings, presence: true
  validates :property_owners, presence: true
  validates :residents, presence: true
  validates :leasing, presence: true
  validates :accounting, presence: true
  validates :lease_docs, presence: true

  def self.for_user(current_user)
    if current_user
      UserRole.where(company_id: current_user.company_id)
    else
      UserRole.where("1=0")
    end
  end

  # If an option is switched to none, no emails should be received
  def update_get_email_flags
    self.get_screening_email = false if self.screening == UserRole::ACCESS_LEVEL_NONE
    self.get_payments_email = false if self.payments == UserRole::ACCESS_LEVEL_NONE
    self.get_leasing_email = false if self.leasing == UserRole::ACCESS_LEVEL_NONE
    self.get_communications_email = false if self.communications == UserRole::ACCESS_LEVEL_NONE
    self.get_maintenance_requests_email = false if self.maintenance_requests == UserRole::ACCESS_LEVEL_NONE
    self.get_listings_email = false if self.listings == UserRole::ACCESS_LEVEL_NONE
  end

  def can_view_reports
    [UserRole::ACCESS_LEVEL_VIEW, UserRole::ACCESS_LEVEL_EDIT, UserRole::ACCESS_LEVEL_DELETE].include?(self.reports)
  end

  def self.permission_fields
    [
      :listings, :screening, :expenses, :payments, :maintenance_requests, :reports, :users, :communications,
     :properties, :vendors, :settings, :property_owners, :residents, :leasing, :accounting, :lease_docs,
     :get_screening_email, :get_payments_email, :get_leasing_email, :get_communications_email, :get_maintenance_requests_email, :get_listings_email
    ]
  end

  def self.public_fields
    [:name, :user_type] + UserRole.permission_fields
  end

  def self.private_fields
    [:id, :hash_id, :company_id]
  end

  def to_builder(_level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.user_count User.where(user_role_id: self.id).count
    end
  end
end
