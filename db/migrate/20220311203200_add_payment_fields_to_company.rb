class AddPaymentFieldsToCompany < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :payments_agreement_ip_address, :string, after: :cell_phone
    add_column :companies, :payments_agreement_at, :datetime, after: :cell_phone
    add_column :companies, :secondary_contact_email, :string, after: :cell_phone
    add_column :companies, :secondary_contact_phone, :string, after: :cell_phone
    add_column :companies, :secondary_contact_title, :string, after: :cell_phone
    add_column :companies, :secondary_contact_last_name, :string, after: :cell_phone
    add_column :companies, :secondary_contact_first_name, :string, after: :cell_phone
    add_column :companies, :primary_contact_email, :string, after: :cell_phone
    add_column :companies, :primary_contact_phone, :string, after: :cell_phone
    add_column :companies, :primary_contact_title, :string, after: :cell_phone
    add_column :companies, :primary_contact_last_name, :string, after: :cell_phone
    add_column :companies, :primary_contact_first_name, :string, after: :cell_phone
    add_column :companies, :units_managed, :integer, after: :cell_phone
    add_column :companies, :year_formed, :integer, after: :cell_phone
    add_column :companies, :legal_business_dba, :string, after: :cell_phone
    add_column :companies, :legal_business_name, :string, after: :cell_phone
    add_column :companies, :payments_onboard_status, :string, after: :cell_phone
  end
end
