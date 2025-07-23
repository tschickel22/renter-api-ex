class AddVerificationAttemptCount < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :verification_attempt_count, :integer, default: 0, after: :screening_package_price
  end
end
