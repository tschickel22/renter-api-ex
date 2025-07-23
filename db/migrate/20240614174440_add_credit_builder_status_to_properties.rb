class AddCreditBuilderStatusToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :enrolled_for_credit_builder_on, :date, after: :ownership_type
  end
end
