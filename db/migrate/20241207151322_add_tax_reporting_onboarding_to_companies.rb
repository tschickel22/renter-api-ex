class AddTaxReportingOnboardingToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :tax_reporting_onboard_status, :string, after: :financial_connections_onboard_status
  end
end
