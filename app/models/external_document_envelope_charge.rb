# TODO this needs to be removed after we migrate all
# external_document_evenlope_charge dat to external_documents
class ExternalDocumentEnvelopeCharge < ParanoidRecord
  has_one :external_document
end