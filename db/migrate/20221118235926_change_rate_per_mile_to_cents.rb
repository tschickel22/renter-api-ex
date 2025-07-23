class ChangeRatePerMileToCents < ActiveRecord::Migration[6.1]
  def change
    change_column :settings, :rate_per_mile, :decimal, precision: 5, scale: 3
  end
end
