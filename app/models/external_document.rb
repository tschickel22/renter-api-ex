class ExternalDocument < ParanoidRecord
  belongs_to :document
  belongs_to :lease
  belongs_to :property
  belongs_to :company
  has_one_attached :attachment

  def self.for_user(current_user)
    if current_user.present?
      if current_user.is_company_admin_at_least?
        where(company_id: current_user.company_id)
      elsif current_user.resident.present?
        where(lease_id: current_user.resident.leases.map(&:id))
      end
    end
  end

  def user_can_sign?(current_user)
    targets = JSON.parse(actions) rescue []
    targets.detect{|t| t["recipient_email"] == current_user.email}.present?
  end

  def self.to_builder(doc: , current_user:)
    if doc.attachment.present? && doc.attachment.attached?
      url = doc.attachment.url #Rails.application.routes.url_helpers.url_for(ed.attachment)
    else
      url = nil
    end
    actions = JSON.parse(doc.actions) rescue []

    Jbuilder.new do |json|
      json.id doc.id
      json.property_name doc.property&.name
      json.property_id doc.property_id
      json.document_id doc.document_id
      json.lease_id doc.lease_id
      json.unit_full_address doc.lease&.unit&.full_address
      json.unit_number doc.lease&.unit&.unit_number
      json.residents doc.lease.residents.map{|r| r.full_name }.join("\n") if doc.lease&.residents&.present?
      json.status doc.status
      json.record_type doc.record_type
      json.external_id doc.external_id
      json.document_name doc.document_name
      json.is_template doc.record_type == 'template'
      json.is_signed_document doc.record_type == 'document'
      json.is_source_document false
      json.url url
      json.created_at doc.created_at
      json.updated_at doc.updated_at
      json.user_can_sign doc.user_can_sign?(current_user)
      json.has_actions actions.length > 0
      json
    end
  end

  def self.to_lease_builder(doc: , current_user:)
    if doc.attachment.present? && doc.attachment.attached?
      url = doc.attachment.url #Rails.application.routes.url_helpers.url_for(ed.attachment)
    else
      url = nil
    end

    Jbuilder.new do |json|
      json.id doc.id
      json.property_name doc.property&.name
      json.unit_full_address doc.lease&.unit&.full_address
      json.unit_number doc.lease&.unit&.unit_number
      json.lease_id doc.lease_id
      json.document_name doc.document_name || ""
      json.url url
      json.created_at doc.created_at
      json.updated_at doc.updated_at
      json.document_type doc.record_type
      json.user_can_sign doc.user_can_sign?(current_user)
      json.status doc.status
    end
  end
end