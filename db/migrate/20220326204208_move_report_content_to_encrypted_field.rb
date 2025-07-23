class MoveReportContentToEncryptedField < ActiveRecord::Migration[6.1]
  def change
    rename_column :lease_resident_reports, :report_content, :report_content_plaintext
    add_column :lease_resident_reports, :encrypted_report_content, :longtext
    add_column :lease_resident_reports, :encrypted_report_content_iv, :string

    LeaseResidentReport.all.each do | lease_resident_report |
      lease_resident_report.report_content = JSON.parse(lease_resident_report.report_content_plaintext)
      lease_resident_report.save
    end
  end
end
