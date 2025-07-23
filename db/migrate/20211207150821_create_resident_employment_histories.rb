class CreateResidentEmploymentHistories < ActiveRecord::Migration[6.1]
  def change
    create_table :resident_employment_histories do |t|
      t.integer :resident_id, index: true
      t.string :employment_status
      t.string :company_name
      t.string :contact_name
      t.string :contact_phone
      t.integer :months_at_company

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
