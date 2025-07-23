class JournalEntry < PermanentRecord
  has_paper_trail versions: {class_name: "Versions::JournalEntry"}

  before_create :generate_hash
  after_save :generate_journal_entry_split_items

  belongs_to :company
  belongs_to :property
  belongs_to :unit

  has_many_attached :documents
  has_many :journal_entry_splits
  has_many :journal_entry_split_items
  has_one :bank_transaction, as: :related_object

  accepts_nested_attributes_for :journal_entry_splits, allow_destroy: true
  validates :entry_on, presence: true
  validates :end_on, presence: true, if: :recurring?
  validate :at_least_one_occurrence, if: :recurring?
  validate :at_least_two_splits
  validate :splits_total_to_zero
  validate :no_updates_if_reconciled

  FREQUENCY_ONE_TIME = 'one_time'
  FREQUENCY_MONTHLY = 'monthly'
  FREQUENCY_ANNUALLY = 'annually'
  FREQUENCY_OPTIONS = {JournalEntry::FREQUENCY_ONE_TIME => 'One-Time', JournalEntry::FREQUENCY_MONTHLY => 'Monthly', JournalEntry::FREQUENCY_ANNUALLY => 'Annually'}

  attr_accessor :documents_batch_number

  def recurring?
    [JournalEntry::FREQUENCY_MONTHLY, JournalEntry::FREQUENCY_ANNUALLY].include?(frequency)
  end

  def at_least_one_occurrence
    if recurring?
      if entry_on.present? && end_on.present?
        if end_on < entry_on
          self.errors.add(:end_on, "cannot be before start date")
        end
      end
    end
  end

  def at_least_two_splits
    if journal_entry_splits.empty? || journal_entry_splits.length < 2
      self.errors.add(:base, "You must enter an account and amount")
    end
  end

  def splits_total_to_zero
    total = journal_entry_splits.inject(0) do | sum, split |
      # Don't count ones we are removing
      if !split.marked_for_destruction?
        sum + (split.amount || 0)
      else
        sum
      end

    end

    if total != 0
      self.errors.add(:base, "Debit and Credit amounts must be equal")
    end
  end

  def paid_on
    entry_on
  end

  def no_updates_if_reconciled
    if frequency_changed? && JournalEntrySplitItem.where(journal_entry_id: self.id).where.not(account_reconciliation_id: nil).exists?
      self.errors.add(:frequency, "cannot be changed after entries are added to an Account Reconciliation")
    elsif entry_on_changed? && JournalEntrySplitItem.where(journal_entry_id: self.id).where.not(account_reconciliation_id: nil).exists?
      self.errors.add(:entry_on, "cannot be changed after entries are added to an Account Reconciliation")
    elsif end_on_changed? && JournalEntrySplitItem.where(journal_entry_id: self.id).where.not(account_reconciliation_id: nil).exists?
      self.errors.add(:end_on, "cannot be changed after entries are added to an Account Reconciliation")
    end
  end

  def self.for_user(current_user)
    if current_user.present?
      JournalEntry.where(company_id: current_user.company_id)
    else
      JournalEntry.where("0=1")
    end
  end

  def property_name
    if property_id.present?
      property.name
    else
      company.name
    end
  end

  def amount
    journal_entry_splits.inject(0) do | sum, split |
      if (split.amount || 0) > 0
        sum + split.amount
      else
        sum
      end
    end
  end

  def calculate_entry_dates
    entry_dates = []
    current_date = self.entry_on
    end_date = self.end_on || self.entry_on

    while current_date <= end_date
      entry_dates << current_date

      if self.frequency == JournalEntry::FREQUENCY_ANNUALLY
        current_date += 1.year
      else
        current_date += 1.month
      end
    end

    return entry_dates
  end

  def generate_journal_entry_split_items

    #
    # This cannot run if there are reconciled entries
    #
    entry_dates = calculate_entry_dates()

    journal_entry_splits.each do | journal_entry_split |

      # Remember this for later deletions
      split_item_ids = journal_entry_split.journal_entry_split_items.pluck(:id)

      entry_dates.each_with_index do | entry_date, index |

        journal_entry_split_item = journal_entry_split.journal_entry_split_items.where(entry_number: index + 1).first_or_initialize

        if journal_entry_split_item.new_record?
          journal_entry_split_item.company_id = self.company_id
          journal_entry_split_item.journal_entry_id = self.id
        else
          split_item_ids.delete(journal_entry_split_item.id)
        end

        journal_entry_split_item.entry_on = entry_date

        journal_entry_split_item.save
      end

      # Remove the un-used ones
      journal_entry_split.journal_entry_split_items.where(id: split_item_ids).destroy_all

    end
  end

  def assignment_for_bank_transaction(source_account_id)
    if journal_entry_splits.length == 2
      journal_entry_splits.find{|eas| eas.account_id != source_account_id}.account_name
    else
      "Multiple Accounts"
    end
  end

  def description_for_bank_transaction()
    self.memo
  end

  def force_destroy
    # If we are removing this ledger_item, we have to remove all related objects
    self.journal_entry_splits.each{|jes| jes.force_destroy}
    self.public_method(:destroy).super_method.call
  end

  def self.public_fields
    [:entry_on, :memo, :property_id, :unit_id, :frequency, :end_on]
  end

  def self.private_fields
    [:id, :hash_id, :property_name, :amount]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each { | field | json.(self, field) }
      self.class.private_fields().each { | field | json.(self, field) }

      if journal_entry_splits.length == 2
        json.account_name journal_entry_splits.collect{|eas| eas.account_name}.join(" / ")
      else
        json.account_name "Multiple"
      end

      json.journal_entry_splits journal_entry_splits.collect{|eas| eas.to_builder.attributes!}
    end
  end

  def self.document_builder(document)
    Jbuilder.new do |json|
      json.id document.id
      json.filename document.filename.to_s
      json.content_type document.content_type
      json.url Rails.application.routes.url_helpers.url_for(document)
    end
  end
end
