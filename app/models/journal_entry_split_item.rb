class JournalEntrySplitItem < ApplicationRecord

  before_destroy :clear_account_entries

  belongs_to :journal_entry
  belongs_to :journal_entry_split

  validates :company_id, presence: true
  validates :journal_entry_id, presence: true
  validates :journal_entry_split_id, presence: true
  validates :entry_on, presence: true

  def clear_account_entries
    # If we are removing this ledger_item, we have to remove all related objects
    AccountEntry.where(related_object: self).each{|ae| ae.force_destroy}
  end

end
