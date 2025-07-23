class AddSubscriptionCustomerIdToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_subscription_customer_id, :string, after: :external_subscription_id
  end
end
