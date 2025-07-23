class AddExternalDocumentNameToExternalDocuments < ActiveRecord::Migration[6.1]
  def change
    add_column :external_documents, :document_name, :text
  end
end
