class CleanUpExpenses < ActiveRecord::Migration[6.1]
  def change

    old_mileages = Account.where(code: "590")

    old_mileages.each do | old_mileage_account |
      travel_expenses = Account.where(company_id: old_mileage_account.company_id, code: Account::CODE_MILEAGE).first

      ExpenseAccountSplit.where(account_id: old_mileage_account.id).each do | eas |
        eas.update_column(:account_id, travel_expenses.id)
      end

      AccountEntry.where(cash_account_id: old_mileage_account.id).each do | ae |
        ae.update_column(:cash_account_id, travel_expenses.id)
      end

      AccountEntry.where(accrual_account_id: old_mileage_account.id).each do | ae |
        ae.update_column(:accrual_account_id, travel_expenses.id)
      end

      old_mileage_account.force_destroy
    end

    execute "ALTER TABLE accounts DROP INDEX index_accounts_on_code_and_company_id"
    add_index :accounts, :code

    BankAccount.all.each do | ba |
      ba.account = nil
      ba.ensure_account
      ba.save
    end
  end
end
