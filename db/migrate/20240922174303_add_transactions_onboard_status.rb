class AddTransactionsOnboardStatus < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :financial_connections_onboard_status, :string, after: :payments_onboard_status
  end
end
