class Item < ParanoidRecord
  validates :name, presence: true

  def self.for_user(current_user)
    if current_user
      if current_user.is_resident?
        Item.where(company_id: [nil, current_user.resident.leases.collect{|l| l.company_id}]).order(:order_number)
      else
        Item.where(company_id: [nil, current_user.company_id]).order(:order_number)
      end
    else
      Item.where("1=0")
    end
  end

  def self.public_fields
    [:name]
  end

  def self.private_fields
    [:id, :company_id, :type]
  end

  def to_builder(level = "full")
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
