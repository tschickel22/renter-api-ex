class RemoveIsSIngleUnitFlag < ActiveRecord::Migration[6.1]
  def change
    remove_column :properties, :is_single_unit
  end
end
