class ResidentResidenceHistory < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}

  attr_accessor :optional_by_setting

  belongs_to :resident

  validates :resident_id, presence: true
  validates :street, presence: true, unless: :optional_by_setting
  validates :city, presence: true, unless: :optional_by_setting
  validates :state, presence: true, unless: :optional_by_setting
  validates :zip, presence: true, unless: :optional_by_setting
  validates :country, presence: true, unless: :optional_by_setting
  validates :months_at_address, presence: true, unless: :optional_by_setting
  validates :residence_type, presence: true, unless: :optional_by_setting

  validates :landlord_name, presence: true, unless: [:optional_by_setting, :residence_type_not_rent?]
  validates :landlord_phone, presence: true, unless: [:optional_by_setting, :residence_type_not_rent?]
  validates :monthly_rent, presence: true, unless: [:optional_by_setting, :residence_type_not_rent?]

  RESIDENCE_TYPE_RENT = 'rent'
  RESIDENCE_TYPE_OWN = 'own'
  RESIDENCE_TYPE_OTHER = 'other'
  RESIDENCE_TYPE_OPTIONS = {ResidentResidenceHistory::RESIDENCE_TYPE_RENT => 'Rent', ResidentResidenceHistory::RESIDENCE_TYPE_OWN => 'Own', ResidentResidenceHistory::RESIDENCE_TYPE_OTHER => 'Other'}

  def is_international?
    country == 'international'
  end

  def residence_type_not_rent?
    residence_type != 'rent'
  end

  def self.public_fields
    [:id, :resident_id] + ResidentResidenceHistory.form_fields
  end

  def self.form_fields
    [:street, :city, :state, :zip, :country, :months_at_address, :residence_type, :landlord_name, :landlord_phone, :landlord_email, :monthly_rent]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end