class CreateJournalEntrySplitItems < ActiveRecord::Migration[6.1]
  def change
    create_table :journal_entry_split_items do |t|
      t.integer :company_id
      t.integer :journal_entry_id, index: true
      t.integer :journal_entry_split_id, index: true
      t.date :entry_on
      t.integer :account_reconciliation_id
      t.timestamps
    end
  end
end
