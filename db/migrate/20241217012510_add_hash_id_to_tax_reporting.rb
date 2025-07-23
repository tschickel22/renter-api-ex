class AddHashIdToTaxReporting < ActiveRecord::Migration[6.1]
  def change
    add_column :tax_reportings, :hash_id, :string, after: :report_year

    TaxReporting.all.each do | tax_reporting |
      tax_reporting.update_column(:hash_id, SecureRandom.random_number.to_s.reverse[0..7])
    end
  end
end
