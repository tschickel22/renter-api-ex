class ExpandUserRolesMore < ActiveRecord::Migration[6.1]
  def change
    add_column :user_roles, :property_owners, :string, after: :users
    add_column :user_roles, :residents, :string, after: :users
    add_column :user_roles, :leasing, :string, after: :users
    add_column :user_roles, :accounting, :string, after: :users

    execute "UPDATE user_roles SET property_owners = CASE WHEN name = 'Company Admin' THEN '#{UserRole::ACCESS_LEVEL_DELETE}' ELSE '#{UserRole::ACCESS_LEVEL_NONE}' END"
    execute "UPDATE user_roles SET residents = '#{UserRole::ACCESS_LEVEL_DELETE}'"
    execute "UPDATE user_roles SET leasing = '#{UserRole::ACCESS_LEVEL_DELETE}'"
    execute "UPDATE user_roles SET accounting = CASE WHEN name = 'Company Admin' THEN '#{UserRole::ACCESS_LEVEL_DELETE}' ELSE '#{UserRole::ACCESS_LEVEL_NONE}' END"
  end
end
