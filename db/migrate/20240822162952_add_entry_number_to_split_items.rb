class AddEntryNumberToSplitItems < ActiveRecord::Migration[6.1]
  def change
    add_column :journal_entry_split_items, :entry_number, :integer
  end
end
