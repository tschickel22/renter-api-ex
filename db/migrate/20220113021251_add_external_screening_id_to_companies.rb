class AddExternalScreeningIdToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :external_screening_id, :string, after: :name
  end
end
