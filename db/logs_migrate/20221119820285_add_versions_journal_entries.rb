class AddVersionsJournalEntries < ActiveRecord::Migration[6.1]
  TEXT_BYTES = 1_073_741_823
  def change

  create_table :versions_journal_entries, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci" do |t|
    t.string   :item_type, { null: false, limit: 191 }
    t.bigint   :item_id,   null: false, index: true
    t.string   :event,     null: false
    t.string   :whodunnit
    t.text     :object, limit: TEXT_BYTES
    t.text     :object_changes, limit: TEXT_BYTES
    t.datetime :created_at
  end
end
end
