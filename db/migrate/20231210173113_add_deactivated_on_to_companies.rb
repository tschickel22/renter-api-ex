class AddDeactivatedOnToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :deactivated_at, :datetime, after: :deleted_at
    add_column :properties, :deactivated_at, :datetime, after: :deleted_at
  end
end
