class AddDelete < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :deleted_at, :datetime, after: :updated_at
  end
end
