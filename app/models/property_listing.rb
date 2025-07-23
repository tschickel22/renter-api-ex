class PropertyListing < PermanentRecord
  has_paper_trail versions: {class_name: "Versions::Company"}
  before_create :generate_hash

  belongs_to :company
  belongs_to :property
  has_many :unit_listings, foreign_key: :property_id,  primary_key: :property_id

  attr_accessor :photos_batch_number
  has_many_attached :photos

  validates :description, presence: true
  validates :contact_phone, presence: true

  PETS_ALLOWED_DOGS = 'dogs'
  PETS_ALLOWED_CATS = 'cats'
  PETS_ALLOWED_BOTH = 'both'
  PETS_ALLOWED_NO_PETS = 'no_pets'

  PETS_ALLOWED_OPTIONS = {cats: "Cats", dogs: "Dogs", both: "Both", no_pets: "No Pets"}
  LAUNDRY_TYPE_OPTIONS = {in_unit: "Washer/Dryer In Unit", hookup: "Washer/Dryer Hookup", facilities: "Laundry Facilities"}
  PARKING_TYPE_OPTIONS = {covered: "Covered Lot", street: "Street", garage: "Garage", other: "Other"}
  AMENITY_OPTIONS = {furnished: "Furnished", wheelchair_accessible: "Wheelchair Accessible", elevator: "Elevator", no_smoking: "No Smoking", ac: "AC", storage: "Storage", loft: "Loft", fitness_center: "Fitness Center", fireplace: "Fireplace", gated_entry: "Gated Entry", dishwasher: "Dishwasher", swimming_pool: "Swimming Pool"}
  UTILITY_OPTIONS = {gas: "Gas", water: "Water", electricity: "Electricity", heat: "Heat", trash_removal: "Trash Removal", sewer: "Sewer", cable: "Cable", air_conditioning: "Air Conditioning"}

  def rent_special_active?
    if !rent_special_title.blank?
      if rent_special_end_on.nil? || rent_special_end_on >= PaymentService.todays_date()
        return rent_special_start_on.nil? || rent_special_start_on <= PaymentService.todays_date()
      end
    end

    return false
  end

  def self.for_user(current_user)
    PropertyListing.where(property: Property.for_user(current_user).active)
  end

  def self.public_fields
    [:property_id, :pets_allowed, :laundry_type, :parking_type, :parking_fee, :description, :amenities,
     :included_utilities, :video_url, :syndication_partner_ids,
     :contact_name, :contact_email, :contact_phone, :agreement,
     :rental_license_number, :rental_license_expires_on,
     :rent_special_title, :rent_special_start_on, :rent_special_end_on ]
  end

  def self.private_fields
    [:id, :hash_id]
  end

  def to_builder(_level = "partial")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end
    end
  end

  def self.photo_builder(photo)
    Jbuilder.new do |json|
      json.id photo.id
      json.filename photo.filename.to_s
      json.content_type photo.content_type
      json.url Rails.application.routes.url_helpers.url_for(photo)
    end
  end
end