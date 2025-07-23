class AddOnboardingFields < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :default_resident_responsible_fee_ach, :boolean
    add_column :companies, :default_resident_responsible_fee_credit_card, :boolean
    add_column :companies, :default_resident_responsible_fee_debit_card, :boolean

    add_column :companies, :consolidated_1099, :boolean
    add_column :companies, :payments_agreement_signature, :string, after: :secondary_contact_email

  end
end
