class AddScreeningScoresToLeaseApplication < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :credit_score, :integer, after: :verification_attempt_count
    add_column :lease_residents, :criminal_record_count, :integer, after: :credit_score
    add_column :lease_residents, :eviction_count, :integer, after: :criminal_record_count
  end
end
