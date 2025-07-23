class AddHashIdToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :hash_id, :string, after: :company_id, index: { unique: true }

    User.all.each do | user |
      user.generate_hash
      user.save
    end
  end
end
