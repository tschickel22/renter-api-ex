class AddScreeningPaymentInfoToLeaseResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :screening_package_id, :integer, after: :external_screening_status
    add_column :lease_residents, :screening_package_price, :decimal, precision: 6, scale: 2, after: :screening_package_id
    remove_column :leases, :screening_package_id
    rename_column :screening_packages, :amount, :price
    add_column :leases, :screening_payment_method_id, :integer, after: :screening_payment_responsibility
  end
end
