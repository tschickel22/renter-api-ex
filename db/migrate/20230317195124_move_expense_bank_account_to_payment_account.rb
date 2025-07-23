class MoveExpenseBankAccountToPaymentAccount < ActiveRecord::Migration[6.1]
  def change
    updates = Expense.all.inject({}) do | acc, expense |
      if expense.bank_account_id.present?
        acc[expense.id] = BankAccount.find(expense.bank_account_id).account_id
      end
      acc
    end

    rename_column :expenses, :bank_account_id, :payment_account_id

    updates.each do | expense_id, payment_account_id|
      expense = Expense.find(expense_id)
      expense.update_column(:payment_account_id, payment_account_id)
    end
  end
end
