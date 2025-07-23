class AddDocumentManagementActiveToCompaniesTable < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :document_management_active, :boolean, default: false
  end
end
