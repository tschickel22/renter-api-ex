class AddLeaseTermToLease < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :lease_term, :integer, after: :security_deposit
  end
end
