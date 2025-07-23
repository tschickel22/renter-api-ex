class CreateLeaseResidentReports < ActiveRecord::Migration[6.1]
  def change
    create_table :lease_resident_reports do |t|
      t.string :hash_id, index: true
      t.integer :lease_resident_id, index: true
      t.string :report_type
      t.longtext :report_content
      t.string :report_content_type

      t.timestamps
    end
  end
end
