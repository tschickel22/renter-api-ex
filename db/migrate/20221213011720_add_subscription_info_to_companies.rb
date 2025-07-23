class AddSubscriptionInfoToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_crm_id, :string, after: :payments_agreement_ip_address
    add_column :companies, :subscription_status, :string, after: :external_crm_id, default: Company::SUBSCRIPTION_STATUS_NEW
    add_column :companies, :subscription_frequency, :string, after: :subscription_status

  end
end
