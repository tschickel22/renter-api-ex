class AddHashIdToCmpanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :hash_id, :string, after: :id, unique: true

    Company.all.each do | company |
      company.update(hash_id: SecureRandom.random_number.to_s.reverse[0..7])
    end
  end
end
