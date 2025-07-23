class AddUniqueKeyToHashIds < ActiveRecord::Migration[6.1]
  def change
    add_index :bank_accounts, :hash_id, unique: true
    add_index :charges, :hash_id, unique: true
    add_index :leases, :hash_id, unique: true
    add_index :lease_residents, :hash_id, unique: true
    add_index :lease_resident_reports, :hash_id, unique: true
    add_index :ledger_items, :hash_id, unique: true
    add_index :payments, :hash_id, unique: true
    add_index :payment_returns, :hash_id, unique: true
    add_index :payment_methods, :hash_id, unique: true
    add_index :residents, :hash_id, unique: true
    add_index :maintenance_requests, :hash_id, unique: true

  end
end
