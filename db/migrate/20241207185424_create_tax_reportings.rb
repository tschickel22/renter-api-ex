class CreateTaxReportings < ActiveRecord::Migration[6.1]
  def change
    create_table :tax_reportings do |t|
      t.integer :company_id, index: true
      t.integer :report_year

      t.string :related_object_type
      t.integer :related_object_id

      t.string :status

      t.decimal :amount_paid, precision: 10, scale: 2, default: 0
      t.decimal :rental_income, precision: 10, scale: 2, default: 0
      t.decimal :other_income, precision: 10, scale: 2, default: 0

      t.timestamps
      t.datetime :deleted_at
    end

    add_index :tax_reportings, [:related_object_type, :related_object_id], name: 'tax_r_related'
  end
end
