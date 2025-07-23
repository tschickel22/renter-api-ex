class AddNsfChargeType < ActiveRecord::Migration[6.1]
  def change
    ChargeType.create(id: ChargeType::NSF_FEES, name: 'NSF Fee', account_code: 518)
  end
end
