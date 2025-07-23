class AddGroupNameToDocuments < ActiveRecord::Migration[6.1]
  def change
    add_column :documents, :group_name, :string
  end
end
