class AddExternalLeaseDocuments < ActiveRecord::Migration[6.1]
  def change
    create_table :external_lease_documents do |t|
      t.integer :lease_id, index: true
      t.integer :company_id, index: true
      t.integer :resident_id, index: true
      t.integer :external_id
      t.string :status
      t.string :document_name
      t.string :type, default: 'pdf'
      t.string :record_type, default: 'document'
      t.timestamps
    end
  end
end
