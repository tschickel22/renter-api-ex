class AddMileageAcocunt < ActiveRecord::Migration[6.1]
  def change
    system_account = Account.create(code: Account::CODE_MILEAGE, account_category_id: 5, name: "Mileage", account_type: "expenses", description: "Mileage")

    Company.all.each do | company |
      company_account_attrs = system_account.attributes.except("id", "created_at", "updated_at")
      company_account_attrs[:company_id] = company.id
      Account.create(company_account_attrs)
    end
  end
end
