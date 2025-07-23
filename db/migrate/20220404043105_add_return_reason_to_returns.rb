class AddReturnReasonToReturns < ActiveRecord::Migration[6.1]
  def change
    add_column :payment_returns, :return_reason, :string, after: :external_processing_fee
  end
end
