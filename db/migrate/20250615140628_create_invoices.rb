class CreateInvoices < ActiveRecord::Migration[6.1]
  def change
    create_table :invoices do |t|
      t.string :hash_id
      t.integer :company_id, index: true
      t.integer :property_id
      t.integer :lease_id, index: true
      t.date :invoice_on
      t.decimal :amount, precision: 10, scale: 2
      t.timestamps
    end
  end
end
