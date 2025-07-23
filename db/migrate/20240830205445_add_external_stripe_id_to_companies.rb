class AddExternalStripeIdToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_stripe_id, :string, after: :external_subscription_plan_code
  end
end
