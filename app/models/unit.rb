class Unit < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  after_save :ensure_geocoding

  belongs_to :property
  has_many :leases

  validates :unit_number, presence: true, if: :property_is_apartment
  validates :street, presence: true
  validates :floor_plan_name, presence: true
  validates :city, presence: true
  validates :state, presence: true
  validates :zip, presence: true
  validates :beds, presence: true
  validates :baths, presence: true
  validates :square_feet, presence: true

  STATUS_VACANT = 'vacant'
  STATUS_VACANT_LEASED = 'vacant_leased'
  STATUS_OCCUPIED = 'occupied'

  STATUS_OPTIONS = {Unit::STATUS_VACANT => 'Vacant', Unit::STATUS_OCCUPIED => 'Occupied', Unit::STATUS_VACANT_LEASED => 'Future Occupied'}

  BEDS_STUDIO = -1

  def property_is_apartment
    self.property&.is_apartment?
  end

  def street_and_unit
    str = self.street
    str += ", Unit ##{self.unit_number}" if !self.unit_number.blank?

    return str
  end

  def name
    unit_number_or_street
  end

  def unit_number_or_street
    return self.unit_number if !self.unit_number.blank?
    return self.street
  end

  def full_address
    strs = [street_and_unit]
    strs << city
    strs << "#{state} #{zip}"
    return strs.join(", ")
  end

  def beds_pretty
    return "Studio" if beds.present? && beds == Unit::BEDS_STUDIO
    return beds
  end

  def available_on_pretty
    return "Now" if available_on.nil? || available_on <= PaymentService.todays_date()
    return available_on.strftime('%m/%d/%Y')
  end

  def is_vacant?
    [Unit::STATUS_VACANT, nil].include?(status)
  end

  def update_status
    # Determine current status
    new_status = nil
    available_on = nil
    current_lease = nil

    self.leases.each do | lease |
      if lease.is_current? && new_status.nil?
        new_status = Unit::STATUS_OCCUPIED
        current_lease = lease
      elsif lease.is_future? && new_status.nil?
        new_status = Unit::STATUS_VACANT_LEASED
        current_lease ||= lease
      end

      if lease.lease_safe_end_on.present? && (lease.is_current? || lease.is_future?) && (available_on.nil? || available_on < lease.lease_safe_end_on)
        available_on = lease.lease_safe_end_on + 1.day
      end
    end

    new_status ||= Unit::STATUS_VACANT

    self.update({status: new_status, available_on: available_on, current_lease_id: current_lease&.id})
  end

  def self.for_user(current_user)
    Unit.where(property: Property.for_user(current_user).active)
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

  def url_stub
    # Format a url like 1-bed-2-bath-condo-in-arvada
    stub_pieces = [self.beds, 'bed']
    stub_pieces << [self.baths, 'bath']
    stub_pieces << self.property.property_type
    stub_pieces << ['in', self.city.gsub(/[^0-9a-z]/i, '-').downcase]

    stub_pieces.flatten.join('-')
  end

  def self.public_fields
    [:id, :property_id, :unit_number, :floor_plan_name, :street, :city, :state, :zip, :beds, :baths, :square_feet]
  end

  def self.private_fields
    [:status, :available_on, :lat, :lng]
  end

  def to_builder(level = "partial")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.name !self.unit_number.blank? ? self.unit_number : self.street
      json.street_and_unit self.street_and_unit
      json.full_address self.full_address

      if level == "full"
        json.leases leases.select{|l| [Lease::STATUS_CURRENT, Lease::STATUS_FUTURE].include?(l.status) || (![Lease::STATUS_FORMER].include?(l.status) && l.updated_at < 30.days.ago)}.collect{|l| l.to_builder("minimal").attributes!}
      end
    end
  end
end
