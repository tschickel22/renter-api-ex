class AddResidentReportContentFields < ActiveRecord::Migration[6.1]
  def change
    remove_column :lease_resident_reports, :report_content_plaintext
    add_column :lease_resident_reports, :audience, :string, after: :report_type

    execute "UPDATE lease_resident_reports SET audience = '#{LeaseResidentReport::AUDIENCE_RESIDENT}'"
  end
end
