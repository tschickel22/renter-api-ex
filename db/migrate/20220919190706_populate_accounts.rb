class PopulateAccounts < ActiveRecord::Migration[6.1]
  require 'csv'
  def change
    filename = "db/migrate/renter-insight-accounts.csv"
    csv_data = CSV.parse(File.read(filename), headers: true)

    csv_data.each do | raw |
      row = raw.to_hash

      account = Account.new(code: row["Account Number"].strip, name: row["Account"].strip)

      account.account_category = if !row["Sub Category (In Renter Insight)"].blank?
                   AccountCategory.where(name: row["Sub Category (In Renter Insight)"].strip).first
                 else
                   AccountCategory.where(name: row["Category (in Renter Insight)"].strip).first
                 end


      account.account_type = Account::TYPE_ASSETS if ["Assets", "Fixed Assets", "Short Term Assets"].include?(row["Type"])
      account.account_type = Account::TYPE_EXPENSES if ["Expenses"].include?(row["Type"])
      account.account_type = Account::TYPE_INCOME if ["Income", "Other Income"].include?(row["Type"])
      account.account_type = Account::TYPE_LIABILITY if ["Liability"].include?(row["Type"])
      account.account_type = Account::TYPE_EQUITY if ["Equity"].include?(row["Type"])
      account.description = row["Description (add to Detail Type on Renter Insight)"]

      account.save
    end
  end
end
