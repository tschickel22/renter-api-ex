class AddExternalDocumentEnvelopeChargeTable < ActiveRecord::Migration[6.1]
  def change
    create_table :external_document_envelope_charges do |t|
      t.integer :external_document_id, index: true
      t.string :status, default: 'created'
      t.timestamps
      t.datetime :deleted_at
    end
  end
end
