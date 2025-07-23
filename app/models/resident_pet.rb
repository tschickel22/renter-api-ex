class ResidentPet < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}

  belongs_to :resident

  validates :resident_id, presence: true
  validates :pet_type, presence: true
  validates :name, presence: true

  PET_TYPE_OPTIONS = {'cat': "Cat", 'dog': 'Dog', 'other': 'Other'}

  def self.for_user(current_user)
    ResidentPet.joins(:resident).where(resident: Resident.for_user(current_user))
  end

  def self.public_fields
    [:id, :resident_id, :pet_type, :breed, :weight, :color, :name]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end