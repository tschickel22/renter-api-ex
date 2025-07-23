class AddCreditCardCategory < ActiveRecord::Migration[6.1]
  def change
    AccountCategory.find(AccountCategory::BANK_ACCOUNTS).update(name: 'Bank Accounts')
    AccountCategory.create(id: AccountCategory::CREDIT_CARDS, name: "Credit Cards", account_type: Account::TYPE_LIABILITY)

    # Find all existing bank accounts that are credit cards and switch their categories
    BankAccount.joins(:account).where.not(account: {account_category_id: AccountCategory::BANK_ACCOUNTS}).each do | bank_account |
      bank_account.account.update(account_category_id: AccountCategory::CREDIT_CARDS)
    end

    Account.where(code: Account::CODE_BANK_CREDIT_CARD).each do | account |
      account.update(account_category_id: AccountCategory::CREDIT_CARDS)
    end
  end
end
