class AddUserIdToResident < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :user_id, :integer, index: true, after: :hash_id
  end
end
