class ResidentContact < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}
  attr_accessor :optional_by_setting
  belongs_to :resident

  validates :resident_id, presence: true
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :relationship_type, presence: true
  validates :phone_number, presence: true

  def self.public_fields
    [:id, :resident_id] + ResidentContact.form_fields
  end

  def self.form_fields
    [:first_name, :last_name, :type, :relationship_type, :phone_number]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end