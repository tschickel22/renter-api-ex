class AddSubscriptionIdToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_subscription_id, :string, after: :external_crm_id
  end
end
