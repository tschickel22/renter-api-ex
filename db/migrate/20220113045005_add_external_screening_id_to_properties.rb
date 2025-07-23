class AddExternalScreeningIdToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :external_screening_id, :string, after: :company_id
  end
end
