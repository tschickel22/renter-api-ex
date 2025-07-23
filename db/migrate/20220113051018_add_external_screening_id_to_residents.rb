class AddExternalScreeningIdToResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :external_screening_id, :string, after: :user_id
  end
end
