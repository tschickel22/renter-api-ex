class VendorLicense < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :vendor
  has_many_attached :licenses

  attr_accessor :licenses_batch_number

  def self.for_user(current_user)
    if current_user
      self.joins(:vendor).where(vendor: {company_id: current_user.company_id})
    else
      self.where("1=0")
    end
  end

  def self.public_fields
    [:id, :vendor_id, :license_type_id, :effective_on, :expires_on, :license_number, :issuing_agency ]
  end

  def self.private_fields
    []
  end

  def self.license_builder(license)
    Jbuilder.new do |json|
      json.id license.id
      json.filename license.filename.to_s
      json.content_type license.content_type
      json.url Rails.application.routes.url_helpers.url_for(license)
    end
  end
end
