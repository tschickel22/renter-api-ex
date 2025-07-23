class PropertyOwnership < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :property
  belongs_to :property_owner

  validates :property_owner_id, presence: true

  def percentage_other=(val)
    self.percentage = val if !val.blank?
  end

  def percentage_other
    self.percentage
  end

  def self.public_fields
    [:property_owner_id, :percentage, :percentage_other]
  end

  def self.private_fields
    [:id]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end
    end
  end
end
