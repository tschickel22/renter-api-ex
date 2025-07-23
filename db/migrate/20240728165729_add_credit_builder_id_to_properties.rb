class AddCreditBuilderIdToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :external_credit_builder_id, :string, after: :external_crm_id
  end
end
