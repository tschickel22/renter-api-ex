class SwitchPropertyUserToUserAssignment < ActiveRecord::Migration[6.1]
  def change
    rename_table :property_users, :user_assignments
    add_column :user_assignments, :entity_type, :string, default: Property.to_s, after: :property_id
    rename_column :user_assignments, :property_id, :entity_id
  end
end
