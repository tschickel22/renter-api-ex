class AddFeeTypeToPayments < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :fee_type, :string, after: :fee_responsibility
  end
end
