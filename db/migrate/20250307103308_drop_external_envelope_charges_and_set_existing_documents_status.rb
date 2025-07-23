class DropExternalEnvelopeChargesAndSetExistingDocumentsStatus < ActiveRecord::Migration[6.1]
  def change
    ExternalDocumentEnvelopeCharge.all.each do |external_document_evenlope_charge|
      external_document = ExternalDocument.find_by(id: external_document_evenlope_charge.external_document_id)
      next unless external_document.present?

      external_document.should_be_billed = true
      external_document.has_been_billed = external_document_evenlope_charge.created_at
      external_document.save!
    end

    drop_table :external_document_envelope_charges
  end
end
