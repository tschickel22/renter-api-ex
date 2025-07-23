class PopulateJournalEntrySplitItems < ActiveRecord::Migration[6.1]
  def change
    ActiveRecord::Base.transaction do
      JournalEntry.all.each do | journal_entry |
        journal_entry.save
      end

      JournalEntrySplitItem.all.each do | journal_entry_split_item|

        # Move the account_reconciliation_id data
        journal_entry_split_item.update(account_reconciliation_id: journal_entry_split_item.journal_entry_split.account_reconciliation_id)

        # Move the account entries
        account_entry = AccountEntry.where(related_object_id: journal_entry_split_item.journal_entry_split_id, related_object_type: JournalEntrySplit, entry_on: journal_entry_split_item.entry_on).first
        account_entry.related_object = journal_entry_split_item
        if !account_entry.save
          raise "Could not save #{account_entry.id} #{account_entry.errors.full_messages.join(", ")}"
        end
      end

      if AccountEntry.where(related_object_type: JournalEntrySplit).exists? && Rails.env.production?
        raise "Not everything was accounted for: #{AccountEntry.where(related_object_type: JournalEntrySplit).pluck(:id)}"
      end
    end
  end
end
