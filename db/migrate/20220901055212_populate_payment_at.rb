class PopulatePaymentAt < ActiveRecord::Migration[6.1]
  def change
    execute "update  payments  set payment_at = created_at where payment_at is null"
  end
end
