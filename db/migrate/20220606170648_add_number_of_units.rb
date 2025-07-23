class AddNumberOfUnits < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :number_of_units, :integer, after: :zip
  end
end
