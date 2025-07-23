class RenamePrintStatus < ActiveRecord::Migration[6.1]
  def change
    rename_column :payments, :print_status, :expense_payment_status
  end
end
