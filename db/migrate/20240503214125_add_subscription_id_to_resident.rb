class AddSubscriptionIdToResident < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :external_subscription_id, :string
  end
end
