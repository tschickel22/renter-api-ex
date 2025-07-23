class AddTypeToAccountCateories < ActiveRecord::Migration[6.1]
  def change
    add_column :account_categories, :account_type, :string, after: :name

    AccountCategory.where(name: "Bank & Credit Cards").update(account_type: Account::TYPE_ASSETS)
    AccountCategory.where(name: "Expenses").update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Advertising & Marketing", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "General Business Expenses", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Insurance", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Interest Paid", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Meals and Entertainment", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Office Expenses", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Other Expenses", parent_account_category: AccountCategory.where(name: "Expenses").first).update(account_type: Account::TYPE_EXPENSES)
    AccountCategory.where(name: "Expensive Items (Assets)").update(account_type: Account::TYPE_ASSETS)
    AccountCategory.where(name: "Income").update(account_type: Account::TYPE_INCOME)
    AccountCategory.where(name: "Liability").update(account_type: Account::TYPE_LIABILITY)
    AccountCategory.where(name: "Long-Term Liability").update(account_type: Account::TYPE_LIABILITY)
    AccountCategory.where(name: "Short Term Liabilities").update(account_type: Account::TYPE_LIABILITY)
    AccountCategory.where(name: "Short-Term Liability").update(account_type: Account::TYPE_LIABILITY)
    AccountCategory.where(name: "Other Income").update(account_type: Account::TYPE_INCOME)
    AccountCategory.where(name: "Short Term Assets").update(account_type: Account::TYPE_ASSETS)
    AccountCategory.where(name: "Owner Investments or Expenses (Equity)").update(account_type: Account::TYPE_EQUITY)
    AccountCategory.where(name: "Personal Expenses", parent_account_category: AccountCategory.where(name: "Owner Inestmentents or Expenses (Equity)").first).update(account_type: Account::TYPE_EQUITY)
    AccountCategory.where(name: "Personal Healthcare", parent_account_category: AccountCategory.where(name: "Owner Inestmentents or Expenses (Equity)").first).update(account_type: Account::TYPE_EQUITY)

    Company.all.each do | company |
      Account.build_out_for_company(company)
    end
  end
end
