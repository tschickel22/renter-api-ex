class LeaseResidentReport < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Lease"}, ignored_columns: [:encrypted_report_content, :encrypted_report_content_iv]
  before_create :generate_hash
  after_initialize :ensure_is_hash

  AUDIENCE_PROPERTY = 'property'
  AUDIENCE_RESIDENT = 'resident'

  serialize :report_content, JSON
  attr_encrypted :report_content, key: Rails.application.credentials.dig(:renter_insight_field_key), marshal: true
  def ensure_is_hash ; self.report_content ||= {} ; end

  def destroy
    # Cannot destroy
  end

  def self.audience_for_user(current_user)
    if current_user.present? && current_user.is_resident?
      LeaseResidentReport::AUDIENCE_RESIDENT
    elsif current_user.present? && current_user.present?
      LeaseResidentReport::AUDIENCE_PROPERTY
    else
      "none"
    end
  end

  def self.public_fields
    [:hash_id, :report_type]
  end

  def to_builder(level = "partial")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      json.report_type (report_type == "Eviction" ? "Eviction Related Proceeding" : report_type)

      if level == "full"
        json.report_content self.clean_report_html()
      end
    end
  end

  def clean_report_html
    report_data = self.report_content.first["reportData"]
    report_data = report_data.gsub("https://ext-test-api-hires.shareable.com/rentals/v1/css/v2/creditV2.0.css", "/trans-union-credit.css")
    return report_data.gsub("https://ext-test-api-hires.shareable.com/rentals/v1/css/v2/criminalV2.0.css", "/trans-union-criminal.css")
  end
end