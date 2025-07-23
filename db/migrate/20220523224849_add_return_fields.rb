class AddReturnFields < ActiveRecord::Migration[6.1]
  def change
    add_column :payment_returns, :return_code, :string, after: :return_reason
    add_column :payments, :deposited_to_account_number, :string, after: :external_message
  end
end
