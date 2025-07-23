class LeadInfo < ParanoidRecord

  belongs_to :lead_source
  belongs_to :unit_listing

  def self.public_fields
    [:beds, :baths, :square_feet, :lead_source_id, :move_in_on, :notes, :unit_listing_id, :reply_via_text, :comment]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end

