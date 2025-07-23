class AddHashIdToLeaseResident < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :hash_id, :string, after: :id
    add_column :lease_residents, :deleted_at, :datetime, after: :updated_at

    LeaseResident.all.each { | lr | lr.save(validate: false)}
  end
end
