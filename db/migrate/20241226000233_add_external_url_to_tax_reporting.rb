class AddExternalUrlToTaxReporting < ActiveRecord::Migration[6.1]
  def change
    add_column :tax_reportings, :external_url, :text, after: :other_income
  end
end
