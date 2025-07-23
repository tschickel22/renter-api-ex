class RenameExternalDocumentHasBeenBiledField < ActiveRecord::Migration[6.1]
  def change
    rename_column :external_documents, :has_been_billed, :has_been_billed_at
  end
end
