class CreateChargeTypes < ActiveRecord::Migration[6.1]
  def change
    create_table :charge_types do |t|
      t.string :name

      t.timestamps
    end

    ChargeType.create(name: 'Fees')
    ChargeType.create(name: 'Rent')
    ChargeType.create(name: 'Deposit')
    ChargeType.create(name: 'Utilities')
  end
end
