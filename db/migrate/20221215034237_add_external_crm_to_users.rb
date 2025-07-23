class AddExternalCrmToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :external_crm_id, :string, after: :cell_phone
  end
end
