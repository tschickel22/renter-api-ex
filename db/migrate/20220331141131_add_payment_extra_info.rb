class AddPaymentExtraInfo < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :extra_info, :string, after: :payment_at
  end
end
