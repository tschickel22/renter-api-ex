class AddScreeningPaymentResponsibilityToLease < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :screening_payment_responsibility, :string, after: :lease_term
    add_column :leases, :screening_package_id, :integer, after: :screening_payment_responsibility
  end
end
