class UnitListing < PermanentRecord
  include ApplicationHelper
  has_paper_trail versions: {class_name: "Versions::Company"}
  before_create :generate_hash

  belongs_to :company
  belongs_to :property
  belongs_to :unit
  has_one :property_listing, foreign_key: :property_id, primary_key: :property_id
  has_many :unit_listing_photo_units
  has_many :unit_listing_photos, through: :unit_listing_photo_units

  validates :name, presence: true
  validates :company_id, presence: true
  validates :property_id, presence: true
  validates :unit_id, presence: true
  validates :status, presence: true

  validate :active_status_ok_with_screening_settings

  attr_accessor :photos_batch_number

  scope :active, -> { where(status: UnitListing::STATUS_ACTIVE) }

  FEATURE_AMENITY_OPTIONS = {air_conditioning: "Air Conditioning", cable_ready: "Cable Ready", fireplace: "Fireplace", storage_units: "Storage Units", washer_dryer: "Washer/Dryer", washer_dryer_hookup: "Washer/Dryer Hookup", heating: "Heating", security_system: "Security System", ceiling_fans: "Ceiling Fans", double_vanities: "Double Vanities", high_speed_internet_access: "High Speed Internet Access", satellite_tv: "Satellite TV", sprinkler_system: "Sprinkler System", tub_shower: "Tub/Shower", surround_sound: "Surround Sound", wi_fi: "Wi-Fi", framed_mirrors: "Framed Mirrors", handrails: "Handrails", intercom: "Intercom", smoke_free: "Smoke Free", trash_compactor: "Trash Compactor", vacuum_system: "Vacuum System", wheelchair_accessible_rooms: "Wheelchair Accessible (Rooms)"}
  KITCHEN_AMENITY_OPTIONS = {dishwasher: "Dishwasher", disposal: "Disposal", microwave: "Microwave", eat_in_kitchen: "Eat-in Kitchen", kitchen: "Kitchen", granite_countertops: "Granite Countertops", ice_maker: "Ice Maker", refrigerator: "Refrigerator", oven: "Oven", stainless_steel_appliances: "Stainless Steel Appliances", range: "Range", breakfast_nook: "Breakfast Nook", coffee_system: "Coffee System", freezer: "Freezer", instant_hot_water: "Instant Hot Water", island_kitchen: "Island Kitchen", pantry: "Pantry", warming_drawer: "Warming Drawer"}
  OUTDOOR_AMENITY_OPTIONS = {balcony: "Balcony", yard: "Yard", grill: "Grill", deck: "Deck", dock: "Dock", garden: "Garden", greenhouse: "Greenhouse", lawn: "Lawn", patio: "Patio", porch: "Porch"}
  LIVING_SPACE_AMENITY_OPTIONS = {bay_window: "Bay Window", tile_floors: "Tile Floors", crown_molding: "Crown Molding", hardwood_floors: "Hardwood Floors", vaulted_ceiling: "Vaulted Ceiling", sunroom: "Sunroom", views: "Views", walk_in_closets: "Walk-In Closets", carpet: "Carpet", attic: "Attic", basement: "Basement", built_in_bookshelves: "Built-In Bookshelves", den: "Den", dining_room: "Dining Room", double_pane_windows: "Double Pane Windows", family_room: "Family Room", furnished: "Furnished", linen_closet: "Linen Closet", loft_layout: "Loft Layout", mother_in_law_unit: "Mother-in-law Unit", mud_room: "Mud Room", office: "Office", recreation_room: "Recreation Room", skylight: "Skylight", vinyl_flooring: "Vinyl Flooring", wet_bar: "Wet Bar", window_coverings: "Window Coverings", workshop: "Workshop", large_bedrooms: "Large Bedrooms"}

  LISTING_TYPE_SPECIFIC_UNIT = 'specific_unit'
  LISTING_TYPE_FLOOR_PLAN = 'floor_plan'
  LISTING_TYPE_OPTIONS = {UnitListing::LISTING_TYPE_SPECIFIC_UNIT => 'Specific Unit', UnitListing::LISTING_TYPE_FLOOR_PLAN => 'Floor Plan'}

  STATUS_NEW = 'new'
  STATUS_ACTIVE = 'active'
  STATUS_INACTIVE = 'inactive'
  STATUS_OPTIONS = {UnitListing::STATUS_NEW => 'New', UnitListing::STATUS_ACTIVE => 'Active', UnitListing::STATUS_INACTIVE => 'Inactive'}

  def metadata_title
    return unit.street_and_unit + " #{property.is_apartment? ? "an" : "a"} #{property.property_type_pretty.downcase} in #{unit.city}, #{unit.state}"
  end

  def metadata_description

    parts = []
    parts << "Beds: #{unit.beds_pretty} | Baths: #{unit.baths} | SQFT: #{number_with_delimiter(unit.square_feet)} | Rent: #{number_to_currency(self.rent, precision: 0)}/mo | Available: #{unit.available_on_pretty}"

    if !self.description.blank?
      parts << self.description
    elsif !property_listing&.description.blank?
      parts << property_listing.description
    end

    return parts.join("\n")
  end

  def is_floor_plan_listing?
    listing_type == UnitListing::LISTING_TYPE_FLOOR_PLAN
  end

  def active_status_ok_with_screening_settings
    if status == UnitListing::STATUS_ACTIVE
      settings = Setting.for_property(self.company_id, self.property_id)

      if settings.application_require_screening && settings.screening_who_pays == Lease::SCREENING_PAYMENT_RESPONSIBILITY_ASK
        errors.add(:status, "You cannot activate this listing with your current settings.  Please edit your screening settings to select either Applicant or Landlord for payment.")
      end
    end
  end

  def first_unit_listing_photo()
    first_photo = property_listing.photos.first

    if first_photo.nil?
      first_photo = unit_listing_photos.find{|ulp| ulp.photo.present? && ulp.photo.attached? }

      if first_photo.present?
        first_photo = first_photo.photo
      end
    end

    return first_photo
  end

  def self.for_user(current_user)
    UnitListing.where(property: Property.for_user(current_user).active)
  end

  def self.public_fields
    [
      :id, :unit_id, :name, :rent, :security_deposit, :lease_term, :available_on, :description,
      :feature_amenities, :kitchen_amenities, :outdoor_amenities, :living_space_amenities,
      :status, :listing_type
    ]
  end

  def self.private_fields
    [:hash_id, :property_id, :updated_at]
  end

  def to_builder(_level = "partial")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      first_unit_listing_photo = unit_listing_photos.find{|ulp| ulp.photo.present? && ulp.photo.attached? }
      json.photo_url Rails.application.routes.url_helpers.url_for(first_unit_listing_photo.photo) if first_unit_listing_photo.present?
      json.status_pretty label_lookup(status, UnitListing::STATUS_OPTIONS)
      json.street_and_unit unit.street_and_unit
      json.floor_plan_name unit.floor_plan_name
      json.url_stub unit.url_stub
      json.lat unit.lat
      json.lng unit.lng
      json.metadata_title metadata_title
      json.metadata_description metadata_description
      json.application_count 0
    end
  end

  def self.photo_builder(unit_listing_photo_unit)
    Jbuilder.new do |json|
      json.id unit_listing_photo_unit.id
      json.unit_listing_id unit_listing_photo_unit.unit_listing_id

      if unit_listing_photo_unit.unit_listing_photo.photo.present? && unit_listing_photo_unit.unit_listing_photo.photo.attached?
        json.filename unit_listing_photo_unit.unit_listing_photo.photo.filename.to_s
        json.content_type unit_listing_photo_unit.unit_listing_photo.photo.content_type
        json.url Rails.application.routes.url_helpers.url_for(unit_listing_photo_unit.unit_listing_photo.photo)
      end
    end
  end
end