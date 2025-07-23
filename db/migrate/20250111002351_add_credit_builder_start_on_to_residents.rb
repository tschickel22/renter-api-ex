class AddCreditBuilderStartOnToResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :credit_builder_start_on, :date, after: :credit_builder_status
  end
end
