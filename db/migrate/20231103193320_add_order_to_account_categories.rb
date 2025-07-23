class AddOrderToAccountCategories < ActiveRecord::Migration[6.1]
  def change
    add_column :account_categories, :order_number, :integer

    execute "UPDATE account_categories SET order_number = CASE WHEN id = #{AccountCategory::BANK_ACCOUNTS} THEN 1 WHEN id = #{AccountCategory::CREDIT_CARDS} THEN 2 ELSE id + 1 END"
  end
end
