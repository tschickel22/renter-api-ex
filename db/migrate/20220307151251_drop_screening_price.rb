class DropScreeningPrice < ActiveRecord::Migration[6.1]
  def change
    remove_column :lease_residents, :screening_package_price
  end
end
