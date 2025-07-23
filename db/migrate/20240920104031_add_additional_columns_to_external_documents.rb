class AddAdditionalColumnsToExternalDocuments < ActiveRecord::Migration[6.1]
  def change
    add_column :external_documents, :company_id, :integer
    add_column :external_documents, :lease_id, :integer
    add_column :external_documents, :property_id, :integer
  end
end
