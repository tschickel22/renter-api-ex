class AddCreditBuilderStatusToResident < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :credit_builder_status, :string
  end
end
