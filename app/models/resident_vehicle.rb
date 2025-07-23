class ResidentVehicle < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}

  belongs_to :resident

  validates :resident_id, presence: true
  validates :make, presence: true
  validates :model, presence: true

  attr_encrypted :plate_number, key: Rails.application.credentials.dig(:renter_insight_field_key)

  def self.for_user(current_user)
    ResidentVehicle.joins(:resident).where(resident: Resident.for_user(current_user))
  end

  def self.public_fields
    [:id, :resident_id, :make, :model, :year, :plate_number, :color, :parking_spot]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end