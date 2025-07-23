class AddChargedForConnectionToBankAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :bank_accounts, :charged_for_connection_at, :datetime, after: :external_stripe_id
  end
end
