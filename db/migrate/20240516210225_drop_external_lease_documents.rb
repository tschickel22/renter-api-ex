class DropExternalLeaseDocuments < ActiveRecord::Migration[6.1]
  def change
    drop_table :external_lease_documents
  end
end
