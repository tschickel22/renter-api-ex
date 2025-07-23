class AddLateFeeChargeType < ActiveRecord::Migration[6.1]
  def change
    ChargeType.create(id: ChargeType::LATE_FEE, name: "Late Fee")
  end
end
