class CreateCreditReportingActivities < ActiveRecord::Migration[6.1]
  def change
    create_table :credit_reporting_activities do |t|
      t.integer :resident_id, index: true
      t.date :reported_on
      t.decimal :amount_reported, precision: 10, scale: 2
      t.integer :api_partner_id
      t.timestamps
    end
  end
end
