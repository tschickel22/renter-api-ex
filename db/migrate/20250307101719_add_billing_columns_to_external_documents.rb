class AddBillingColumnsToExternalDocuments < ActiveRecord::Migration[6.1]
  def change
    add_column :external_documents, :should_be_billed, :boolean, default: false
    add_column :external_documents, :has_been_billed, :datetime
  end
end
