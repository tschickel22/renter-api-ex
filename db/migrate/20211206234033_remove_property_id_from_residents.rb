class RemovePropertyIdFromResidents < ActiveRecord::Migration[6.1]
  def change
    remove_column :residents, :property_id
  end
end
