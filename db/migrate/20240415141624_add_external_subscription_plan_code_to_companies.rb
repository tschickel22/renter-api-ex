class AddExternalSubscriptionPlanCodeToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_subscription_plan_code, :string, after: :external_subscription_customer_id
  end
end
