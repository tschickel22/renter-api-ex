class AddExternalCrmToProperties < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :external_crm_id, :string, after: :ownership_type
  end
end
