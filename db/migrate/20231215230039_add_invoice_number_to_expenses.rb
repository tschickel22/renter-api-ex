class AddInvoiceNumberToExpenses < ActiveRecord::Migration[6.1]
  def change
    add_column :expenses, :invoice_number, :string, after: :paid_on
  end
end
