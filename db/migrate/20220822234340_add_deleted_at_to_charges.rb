class AddDeletedAtToCharges < ActiveRecord::Migration[6.1]
  def change
    add_column :charges, :deactivated_at, :datetime, after: :updated_at
  end
end
