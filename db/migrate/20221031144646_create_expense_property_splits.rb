class CreateExpensePropertySplits < ActiveRecord::Migration[6.1]
  def change
    create_table :expense_property_splits do |t|
      t.integer :expense_id, index: true
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :unit_id, index: true
      t.decimal :amount, precision: 10, scale: 2

      t.timestamps
    end
  end
end
