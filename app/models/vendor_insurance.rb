class VendorInsurance < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :vendor
  has_many_attached :declarations

  attr_accessor :declarations_batch_number

  def self.for_user(current_user)
    if current_user
      self.joins(:vendor).where(vendor: {company_id: current_user.company_id})
    else
      self.where("1=0")
    end
  end

  def self.public_fields
    [:id, :vendor_id, :insurance_type_id, :effective_on, :expires_on, :insurance_company_name, :policy_number, :liability_limit]
  end

  def self.private_fields
    []
  end

  def self.declaration_builder(declaration)
    Jbuilder.new do |json|
      json.id declaration.id
      json.filename declaration.filename.to_s
      json.content_type declaration.content_type
      json.url Rails.application.routes.url_helpers.url_for(declaration)
    end
  end
end
