class LeadSource < ParanoidRecord

  NAME_DWELLSY = "Dwellsy"
  NAME_RENT = "Rent.com"
  NAME_RENTAL_SOURCE = "Rental Soure"
  NAME_ZILLOW = "Zillow"
  NAME_ZUMPER = "Zumper"

  def self.public_fields
    [:name]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      json.id self.id
    end
  end
end


