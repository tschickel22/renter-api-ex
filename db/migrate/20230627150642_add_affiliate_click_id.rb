class AddAffiliateClickId < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :affiliate_click_code, :string, after: :subscription_frequency
  end
end
