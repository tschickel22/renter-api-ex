class AddUseSeparateBankAccountForDeposits < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :use_same_bank_account_for_deposits, :boolean, default: true, after: :consolidated_1099
  end
end
