class ChargeType < PermanentRecord

  FEES = 1
  RENT = 2
  DEPOSIT = 3
  UTILITIES = 4
  LATE_FEE = 5
  NSF_FEES = 6
  PET_RENT = 7

  def self.public_fields
    [:id, :name]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end
