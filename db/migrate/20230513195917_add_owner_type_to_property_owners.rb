class AddOwnerTypeToPropertyOwners < ActiveRecord::Migration[6.1]
  def change
    add_column :property_owners, :owner_type, :string, after: :name, default: PropertyOwner::OWNER_TYPE_INDIVIDUAL
  end
end
