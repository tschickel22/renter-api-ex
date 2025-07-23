class AddExternalStripeIdToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :external_stripe_id, :string, after: :external_id
  end
end
