class CreateAccountCategories < ActiveRecord::Migration[6.1]
  def change
    create_table :account_categories do |t|
      t.string :name
      t.integer :parent_account_category_id, index: true

      t.timestamps
    end

    AccountCategory.create(name: "Bank Accounts")
    AccountCategory.create(name: "Expenses")
    AccountCategory.create(name: "Advertising & Marketing", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "General Business Expenses", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "Insurance", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "Interest Paid", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "Meals and Entertainment", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "Office Expenses", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "Other Expenses", parent_account_category: AccountCategory.where(name: "Expenses").first)
    AccountCategory.create(name: "Expensive Items (Assets)")
    AccountCategory.create(name: "Income")
    AccountCategory.create(name: "Liability")
    AccountCategory.create(name: "Long-Term Liability", parent_account_category: AccountCategory.where(name: "Liability").first)
    AccountCategory.create(name: "Short Term Liabilities", parent_account_category: AccountCategory.where(name: "Liability").first)
    AccountCategory.create(name: "Short-Term Liability", parent_account_category: AccountCategory.where(name: "Liability").first)
    AccountCategory.create(name: "Other Income")
    AccountCategory.create(name: "Short Term Assets")
    AccountCategory.create(name: "Owner Investments or Expenses (Equity)")
    AccountCategory.create(name: "Personal Expenses", parent_account_category: AccountCategory.where(name: "Owner Investments or Expenses (Equity)").first)
    AccountCategory.create(name: "Personal Healthcare", parent_account_category: AccountCategory.where(name: "Owner Investments or Expenses (Equity)").first)

  end
end
