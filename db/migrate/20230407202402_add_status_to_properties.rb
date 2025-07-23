class AddStatusToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :status, :string, after: :name, default: Property::STATUS_ACTIVE, index: true
  end
end
