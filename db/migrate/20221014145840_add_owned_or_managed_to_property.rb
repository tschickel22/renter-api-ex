class AddOwnedOrManagedToProperty < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :ownership_type, :string, default: Property::OWNERSHIP_TYPE_OWNED
  end
end
