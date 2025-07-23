class AnnouncementRecipient < ApplicationRecord
  include ApplicationHelper
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :announcement
  belongs_to :recipient, polymorphic: true

  serialize :recipient_conditions, JSON

  def recipient_conditions_pretty
    if !recipient_conditions.blank? && !recipient_conditions["status"].blank?
      "Resident Status: #{label_lookup(recipient_conditions["status"], Resident::STATUS_OPTIONS)}"
    end
  end

  def self.public_fields
    [:recipient_id, :recipient_type, :recipient_conditions]
  end

  def self.private_fields
    [:id, :announcement_id]
  end

  def to_builder
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.recipient_conditions_pretty recipient_conditions_pretty()

      if recipient_type == LeaseResident.to_s
        json.resident recipient.resident.to_builder().attributes!
      end
    end
  end
end
