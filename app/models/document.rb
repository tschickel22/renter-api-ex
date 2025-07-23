class Document < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Lease"}
  has_one_attached :attachment
  belongs_to :lease
  belongs_to :property
  belongs_to :company
  has_many :external_documents, dependent: :destroy

  after_create :update_group_id

  def self.for_user(current_user)
    if current_user.present?
      Document.where(company_id: current_user.company_id)
    end
  end

  def self.to_builder(doc: )
    if doc.attachment.present? && doc.attachment.attached?
      url = doc.attachment.url #Rails.application.routes.url_helpers.url_for(ed.attachment)
    else
      url = nil
    end

    Jbuilder.new do |json|
      json.id doc.id
      json.group_id doc.group_id
      json.group_name doc.group_name || doc.document_name
      json.property_name doc.property&.name
      json.property_id doc.property_id
      json.lease_id doc.lease_id
      json.can_be_signed doc.company_id.present?
      json.can_be_template doc.company_id.present?
      json.unit_full_address doc.lease&.unit&.full_address
      json.unit_number doc.lease&.unit&.unit_number
      json.residents doc.lease.residents.map{|r| r.full_name }.join("\n") if doc.lease&.residents&.present?
      json.document_name doc.document_name
      json.content_type doc.content_type
      json.url url
      json.created_at doc.created_at
      json.updated_at doc.updated_at
      json.document_type doc.document_type
      json.status "uploaded"
      json.is_source_document true
      json.is_template false
      json.is_signed_document false

      json
    end
  end

  def self.to_lease_builder(doc: )
    if doc.attachment.present? && doc.attachment.attached?
      url = doc.attachment.url #Rails.application.routes.url_helpers.url_for(ed.attachment)
    else
      url = nil
    end

    Jbuilder.new do |json|
      json.id doc.id
      json.property_name doc.property&.name
      json.group_id doc.group_id
      json.group_name doc.group_name || doc.document_name
      json.unit_full_address doc.lease&.unit&.full_address
      json.unit_number doc.lease&.unit&.unit_number
      json.lease_id doc.lease_id
      json.document_name doc.document_name || ""
      json.document_name doc.document_name
      json.content_type doc.content_type
      json.url url
      json.created_at doc.created_at
      json.updated_at doc.updated_at
      json.document_type doc.document_type
      json.user_can_sign false
      json.status "uploaded"
    end
  end

  def update_group_id
    return if self.group_id.present?

    self.group_id = self.id

    self.save!
  end
end