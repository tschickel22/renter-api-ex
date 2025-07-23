class AddExpensePaymentFields < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :expense_id, :integer, index: true, after: :payment_method_id
    add_column :payments, :from_account_id, :integer, after: :payment_method_id
  end
end
