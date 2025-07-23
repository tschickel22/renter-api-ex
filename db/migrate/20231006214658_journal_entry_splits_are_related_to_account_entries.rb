class JournalEntrySplitsAreRelatedToAccountEntries < ActiveRecord::Migration[6.1]
  def change
    # Move all account entries to be related to the JournalEntrySplit, not the JournalEntry
    execute "UPDATE
        account_entries
      JOIN
        journal_entry_splits
      ON related_object_id = journal_entry_splits.journal_entry_id
        AND account_entries.cash_account_id = journal_entry_splits.account_id
        AND account_entries.amount= journal_entry_splits.amount
      SET
        related_object_id = journal_entry_splits.id,
        related_object_type = 'JournalEntrySplit'
      WHERE
      account_entries.related_object_type = 'JournalEntry'"
  end
end
