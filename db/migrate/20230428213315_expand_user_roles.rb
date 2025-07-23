class ExpandUserRoles < ActiveRecord::Migration[6.1]
  def change
    add_column :user_roles, :users, :string, after: :reports
    add_column :user_roles, :communications, :string, after: :reports
    add_column :user_roles, :properties, :string, after: :reports
    add_column :user_roles, :vendors, :string, after: :reports
    add_column :user_roles, :settings, :string, after: :reports

    execute "UPDATE user_roles SET users = CASE WHEN name = 'Company Admin' THEN '#{UserRole::ACCESS_LEVEL_DELETE}' ELSE '#{UserRole::ACCESS_LEVEL_NONE}' END"
    execute "UPDATE user_roles SET communications = '#{UserRole::ACCESS_LEVEL_DELETE}'"
    execute "UPDATE user_roles SET properties = CASE WHEN name = 'Company Admin' THEN '#{UserRole::ACCESS_LEVEL_DELETE}' ELSE '#{UserRole::ACCESS_LEVEL_NONE}' END"
    execute "UPDATE user_roles SET vendors = '#{UserRole::ACCESS_LEVEL_DELETE}'"
    execute "UPDATE user_roles SET settings = CASE WHEN name = 'Company Admin' THEN '#{UserRole::ACCESS_LEVEL_DELETE}' ELSE '#{UserRole::ACCESS_LEVEL_NONE}' END"

  end
end
