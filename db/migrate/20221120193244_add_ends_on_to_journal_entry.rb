class AddEndsOnToJournalEntry < ActiveRecord::Migration[6.1]
  def change
    add_column :journal_entries, :end_on, :date, after: :entry_on
  end
end
