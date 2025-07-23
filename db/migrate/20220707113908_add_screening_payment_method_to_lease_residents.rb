class AddScreeningPaymentMethodToLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :screening_payment_method_id, :integer, after: :recurring_payment_method_id
  end
end
