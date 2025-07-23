class CreateUserRoles < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :user_role_id, :integer, index: true, after: :hash_id

    create_table :user_roles do |t|
      t.string :hash_id, index: { unique: true }
      t.integer :company_id, index: true
      t.string :name

      t.string :user_type
      t.string :listings
      t.string :screening
      t.string :expenses
      t.string :payments
      t.string :maintenance_requests
      t.string :reports

      t.timestamps
      t.datetime :deleted_at
    end

    # Generate the default roles for all existing companies
    Company.all.each do | company |
      company.build_default_user_roles
    end

    # Update all users with these roles
    User.where(user_type: [User::TYPE_COMPANY_ADMIN, User::TYPE_COMPANY_USER]).each do | user |
      user.user_role = UserRole.where(company_id: user.company_id, user_type: user.user_type).first
      user.save(validate: false)
    end
  end
end
