class AddHashIdToDeposits < ActiveRecord::Migration[6.1]
  def change
    add_column :deposits, :hash_id, :string, index: true, after: :id

    Deposit.all.each do | deposit|
      deposit.generate_hash
      deposit.save(validate: false)
    end
  end
end
