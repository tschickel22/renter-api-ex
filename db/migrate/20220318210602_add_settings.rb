class AddSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :application_include_co_applicants, :boolean
    add_column :settings, :application_include_minors, :boolean
    add_column :settings, :application_include_guarantors, :boolean
    add_column :settings, :application_include_pets, :boolean
    add_column :settings, :application_include_resident_histories, :string
    add_column :settings, :application_include_employment_histories, :string
    add_column :settings, :application_include_income, :string
    add_column :settings, :application_include_emergency_contacts, :string
    add_column :settings, :application_include_references, :string
    add_column :settings, :application_include_identification, :string
    add_column :settings, :application_include_vehicles, :boolean
    add_column :settings, :application_require_screening, :boolean
    add_column :settings, :application_allow_no_ssn_applicants, :boolean
    add_column :settings, :application_charge_fee, :boolean
    add_column :settings, :application_fee, :decimal, scale: 2, precision: 10
    add_column :settings, :require_ssn, :boolean
    add_column :settings, :screening_who_pays, :string
    add_column :settings, :default_screening_package_id, :integer
    add_column :settings, :items_required_for_move_in, :string
    add_column :settings, :items_required_for_move_out, :string
    add_column :settings, :late_rent_fee_charge_percent, :integer
    add_column :settings, :email_signature, :text
    add_column :settings, :require_renters_insurance, :boolean
  end
end
