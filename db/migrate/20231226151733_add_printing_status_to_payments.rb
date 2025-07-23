class AddPrintingStatusToPayments < ActiveRecord::Migration[6.1]
  def change
    add_column :payments, :print_status, :string, after: :extra_info
  end
end
