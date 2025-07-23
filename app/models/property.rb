class Property < ParanoidRecord
  include ApplicationHelper
  has_paper_trail versions: {class_name: "Versions::Company"}

  after_save :ensure_geocoding

  belongs_to :company

  has_many :units
  has_many :leases
  has_many :property_ownerships
  has_many :bank_accounts
  has_one :property_listing
  has_many :unit_listings
  has_many :user_assignments, as: :entity
  has_many :documents
  has_many :external_documents
  validates :name, presence: true
  validates :property_type, presence: true
  validates :ownership_type, presence: true

  TYPE_CONDO = "condo"
  TYPE_HOUSE = "house"
  TYPE_APARTMENT = "apartment"
  TYPE_DUPLEX = "duplex"
  TYPE_OPTIONS = {Property::TYPE_CONDO => "Condo", Property::TYPE_HOUSE => "House", Property::TYPE_APARTMENT => "Apartment", Property::TYPE_DUPLEX => "Duplex"}

  OWNERSHIP_TYPE_OWNED = "owned"
  OWNERSHIP_TYPE_MANAGED = "managed"
  OWNERSHIP_TYPE_OPTIONS = {Property::OWNERSHIP_TYPE_OWNED => "Owned", Property::OWNERSHIP_TYPE_MANAGED => "Managed"}

  STATUS_ACTIVE = 'active'
  STATUS_INACTIVE = 'inactive'

  accepts_nested_attributes_for :property_ownerships
  accepts_nested_attributes_for :units
  accepts_nested_attributes_for :unit_listings

  scope :active, -> { where(status: Property::STATUS_ACTIVE)}

  def is_apartment?
    property_type == Property::TYPE_APARTMENT
  end

  def property_type_pretty
    label_lookup(property_type, Property::TYPE_OPTIONS)
  end

  def screening_is_activated?
    settings = Setting.for_property(company_id, id)
    !external_screening_id.blank? && screening_attestation.present? && settings.present? && settings.application_require_screening
  end

  def self.for_user(current_user)
    if current_user && current_user.is_resident?
      Property.where(id: current_user.resident.leases.collect{|l| l.property_id})
    elsif current_user && current_user.is_company_admin?
      Property.where(company_id: current_user.company_id)
    elsif current_user && current_user.is_company_user?
      if current_user.is_property_owner?
        Property.where(id: current_user.property_ids)
      else
        Property.joins(:user_assignments).where(company_id: current_user.company_id, user_assignments: {user_id: current_user.id})
      end
    elsif current_user && current_user.is_admin?
      Property.where("1=1")
    else
      Property.where("1=0")
    end
  end

  def full_address
    strs = [street]
    strs << city
    strs << "#{state} #{zip}"
    return strs.join(", ")
  end

  def ensure_geocoding
    if self.lat.nil? || self.lng.nil?
      data = RenterInsightGoogleApi.new.geocode(self.full_address)

      if data.present? && data["results"].present?
        data.deep_symbolize_keys!

        self.lat = ApiProcessor.read_xml_value(data, 'results/geometry/location/lat')
        self.lng = ApiProcessor.read_xml_value(data, 'results/geometry/location/lng')
        self.save(validate: false)
      end
    end
  end

  def deactivate
    self.status = Property::STATUS_INACTIVE
    self.deactivated_at ||= Time.now
    self.save(validate: false)
  end

  def reactivate
    self.status = Property::STATUS_ACTIVE
    self.deactivated_at = nil
    self.save(validate: false)
  end

  def destroy
    super

    # Delete all property ownerships too
    PropertyOwnership.where(property_id: self.id).destroy_all
  end

  def self.public_fields
    [:name, :street, :city, :state, :zip, :property_type, :ownership_type]
  end

  def self.private_fields
    [:id, :status, :company_id, :external_screening_id, :external_insurance_id, :screening_attestation]
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      all_units = units.to_a

      if level == "full"
        if !units.empty?
          json.(all_units.first, :street, :city, :state, :zip)
        else
          json.(self, :street, :city, :state, :zip)
        end

        current_leases = leases.select{|lease| lease.status == Lease::STATUS_CURRENT}

        # Stats
        json.units_total all_units.count
        json.units_occupied (current_leases.count)
        json.units_electronic_payments (current_leases.inject(0) {|sum, lease| sum += (lease.electronic_payments ? 1 : 0) })
        json.units_renters_insurance (current_leases.inject(0) {|sum, lease| sum += (lease.renters_insurance ? 1 : 0) })

        json.rent_total current_leases.inject(0) {|sum, lease| sum += lease.rent }
        json.rent_past_due 0

        json.lease_expirations current_leases.select{|lease| lease.lease_safe_end_on.present? && lease.lease_safe_end_on >= Date.today && lease.lease_safe_end_on <= 60.days.from_now}.count
        json.active_listings (0)

        if level == "full"
          json.property_ownerships self.property_ownerships.collect{|po| po.to_builder.attributes!}
          json.units self.units.collect{|u| u.to_builder.attributes!}
        end
      end

    end
  end
end
