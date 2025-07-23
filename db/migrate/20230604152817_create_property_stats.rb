class CreatePropertyStats < ActiveRecord::Migration[6.1]
  def change
    create_table :property_stats do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.date :report_date
      t.integer :units_occupied
      t.integer :units_vacant_leased
      t.integer :units_total
      t.decimal :rent_billed, precision: 10, scale: 2
      t.decimal :rent_collected, precision: 10, scale: 2
      t.decimal :income, precision: 10, scale: 2
      t.decimal :expenses, precision: 10, scale: 2
      t.datetime :updated_at
    end

    add_index :property_stats, [:company_id, :property_id, :report_date], unique: true, name: 'cprm'

    PopulatePropertyStats.perform()

    ["2022-06-01","2022-07-01","2022-08-01","2022-09-01","2022-10-01","2022-11-01","2022-12-01","2023-01-01","2023-02-01","2023-03-01","2023-04-01","2023-05-01"].each do | month |
      execute "INSERT INTO `property_stats` ( `company_id`, `property_id`, `report_date`, `units_occupied`, `units_vacant_leased`, `units_total`, `rent_billed`, `rent_collected`, `income`, `expenses`, `updated_at`)
  select
  `company_id`, `property_id`, '#{month}' `report_date`, 0 `units_occupied`, 0 `units_vacant_leased`, 0 `units_total`, 0 `rent_billed`, 0`rent_collected`, 0`income`,0 `expenses`, `updated_at`
  from property_stats where report_date='2023-06-01'"
    end
  end
end
