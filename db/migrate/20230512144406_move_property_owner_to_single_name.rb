class MovePropertyOwnerToSingleName < ActiveRecord::Migration[6.1]
  def change
    execute "UPDATE property_owners SET first_name = concat(first_name, ' ', last_name)"
    rename_column :property_owners, :first_name, :name
    remove_column :property_owners, :last_name
  end
end
