class ExpandRolesForEmail < ActiveRecord::Migration[6.1]
  def change
    add_column :user_roles, :get_screening_email, :boolean, default: true, after: :screening
    add_column :user_roles, :get_payments_email, :boolean, default: true, after: :payments
    add_column :user_roles, :get_leasing_email, :boolean, default: true, after: :leasing
    add_column :user_roles, :get_communications_email, :boolean, default: true, after: :communications
    add_column :user_roles, :get_maintenance_requests_email, :boolean, default: true, after: :maintenance_requests
    add_column :user_roles, :get_listings_email, :boolean, default: true, after: :listings

    UserRole.all.each do | user_role |
      user_role.update_get_email_flags
      user_role.save
    end
  end
end
