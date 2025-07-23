class AddCodeToChargeType < ActiveRecord::Migration[6.1]
  def change
    add_column :charge_types, :account_code, :integer, after: :name

    ChargeType.where(name: "Fees").update(account_code: 434)
    ChargeType.where(name: "Rent").update(account_code: Account::CODE_RENTAL_INCOME)
    ChargeType.where(name: "Deposit").update(account_code: Account::CODE_DEPOSITS_HELD)
    ChargeType.where(name: "Utilities").update(account_code: 430)
    ChargeType.where(name: "Late Fee").update(account_code: 422)
  end
end
