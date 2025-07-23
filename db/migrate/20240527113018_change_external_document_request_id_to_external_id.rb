class ChangeExternalDocumentRequestIdToExternalId < ActiveRecord::Migration[6.1]
  def change
    rename_column :external_documents, :request_id, :external_id
  end
end
