class AddDocumentsToUserRoles < ActiveRecord::Migration[6.1]
  def change
    add_column :user_roles, :lease_docs, :string, after: :property_owners

    execute "UPDATE user_roles SET lease_docs = CASE WHEN name = 'Company Admin' THEN '#{UserRole::ACCESS_LEVEL_DELETE}' ELSE '#{UserRole::ACCESS_LEVEL_EDIT}' END"
  end
end
