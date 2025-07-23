class ChangeCodeToDecimal < ActiveRecord::Migration[6.1]
  def change
    change_column :accounts, :code, :decimal, precision: 6, scale: 2

    # Clean up existing codes to make them unique
    sql = "select company_id,code from accounts group by company_id,code having count(*)>1"
    data = ActiveRecord::Base.connection.select_all(ActiveRecord::Base.send('sanitize_sql_array',sql)).to_a

    data.each do | row |
      inc = 0.0
      accounts = Account.where(row)

      accounts.each do | account |
        account.update_column(:code, account.code + inc)
        inc += 0.1
      end
    end
  end
end
