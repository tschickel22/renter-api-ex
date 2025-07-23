class AddTimeSavingFlags < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :electronic_payments, :boolean, default: false, after: :move_out_step
    add_column :leases, :renters_insurance, :boolean, default: false, after: :electronic_payments

    Lease.all.each do | lease |
      lease.save(validate: false)
    end
  end
end
