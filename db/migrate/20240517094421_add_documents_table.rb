class AddDocumentsTable < ActiveRecord::Migration[6.1]
  def change
    ActiveRecord::Base.transaction do
      if !table_exists?(:documents)
        create_table :documents do |t|
          t.integer :lease_id, index: true
          t.integer :company_id, index: true
          t.integer :property_id, index: true
          t.string :external_id
          t.string :status
          t.string :document_name
          t.string :content_type
          t.string :document_type
          t.timestamps
          t.datetime :deleted_at
        end
      end

      leases = Lease.all
      leases.each do |l|
        l.lease_documents.each do |ld|
          doc = Document.create(
            lease_id: l.id,
            property_id: l.property_id,
            company_id: l.company_id,
            document_name: ld.filename.to_s,
            content_type: ld.content_type,
            document_type: 'lease_document'
          )
          ld.name = "attachment"
          ld.record_id = doc.id
          ld.record_type = "Document"
          ld.save!
        end

        l.move_out_documents.each do |md|
          doc = Document.create(
            lease_id: l.id,
            property_id: l.property_id,
            company_id: l.company_id,
            document_name: md.filename.to_s,
            content_type: md.content_type,
            document_type: 'move_out_document'
          )

          md.name = "attachment"
          md.record_id = doc.id
          md.record_type = "Document"
          md.save!
        end
      end
    end
  end
end
