class CreatePrintedChecks < ActiveRecord::Migration[6.1]
  def change
    create_table :printed_checks do |t|
      t.integer :company_id, index: true
      t.integer :bank_account_id, index: true
      t.string :hash_id, index: true
      t.string :status
      t.string :check_number
      t.string :paid_to
      t.decimal :amount, precision: 10, scale: 2
      t.string :description
      t.string :memo
      t.integer :related_object_id
      t.string :related_object_type
      t.datetime :printed_on

      t.timestamps
      t.datetime :deleted_at
    end

    add_index :printed_checks, [:related_object_id, :related_object_type], name: 'printed_check_object'
  end
end
