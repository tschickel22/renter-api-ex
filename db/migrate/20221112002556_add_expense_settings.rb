class AddExpenseSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :rate_per_mile, :decimal, precision: 10, scale: 2, after: :require_renters_insurance
    add_column :settings, :fixed_asset_depreciation, :decimal, precision: 3, scale: 1, after: :rate_per_mile
  end
end
