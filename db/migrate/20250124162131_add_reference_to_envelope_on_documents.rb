class AddReferenceToEnvelopeOnDocuments < ActiveRecord::Migration[6.1]
  def change
    add_column :documents, :group_id, :int
  end
end
