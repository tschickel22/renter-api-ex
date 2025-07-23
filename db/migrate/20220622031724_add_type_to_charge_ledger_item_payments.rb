class AddTypeToChargeLedgerItemPayments < ActiveRecord::Migration[6.1]
  def change
    rename_column :payments, :payment_type, :type
    add_index :payments, :type

    add_column :charges, :type, :string, after: :id
    add_index :charges, :type

    add_column :ledger_items, :type, :string, after: :id
    add_index :ledger_items, :type

    execute "UPDATE charges SET type = 'ResidentCharge'"
    execute "UPDATE ledger_items SET type = 'ResidentLedgerItem'"
    execute "UPDATE payments SET type = 'ResidentPayment'"
  end
end
