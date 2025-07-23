class AddExternalDocumentTable < ActiveRecord::Migration[6.1]
  def change
    create_table :external_documents do |t|
      t.integer :document_id, index: true
      t.string :request_id
      t.string :status
      t.text :actions
      t.string :record_type, default: 'signed_document'
      t.timestamps
      t.datetime :deleted_at
    end
  end
end
