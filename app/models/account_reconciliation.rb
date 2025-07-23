include ActionView::Helpers::NumberHelper

class AccountReconciliation < PermanentRecord
  has_paper_trail versions: {class_name: "Versions::Company"}
  before_create :generate_hash

  belongs_to :company
  belongs_to :bank_account

  STATUS_OPEN = 'open'
  STATUS_CLOSED = 'closed'
  STATUS_OPTIONS = {AccountReconciliation::STATUS_OPEN => "Open", AccountReconciliation::STATUS_CLOSED => "Reconciled"}

  SUPPORTED_ACCOUNT_ENTRY_TYPES = [LedgerItem.to_s, Expense.to_s, JournalEntrySplitItem.to_s]

  serialize :account_entry_object_ids, Array

  validates :company_id, presence: true
  validates :bank_account_id, presence: true

  validates :begin_on, presence: true
  validates :end_on, presence: true

  validates :beginning_balance, presence: true
  validates :ending_balance, presence: true

  validate :reconciliation_dates_do_not_gap, if: :new_record?
  validate :reconciliation_dates_do_not_overlap
  validate :difference_must_be_zero_to_close

  def is_open?
    status == AccountReconciliation::STATUS_OPEN
  end

  def is_closed?
    status == AccountReconciliation::STATUS_CLOSED
  end

  def difference
    ending_balance - cleared_balance
  end

  def update_cleared_balance()

    self.credit_amount = 0
    self.debit_amount = 0
    self.credit_count = 0
    self.debit_count = 0

    self.cleared_balance = self.account_entries.inject(self.beginning_balance) do | sum, account_entry |

      multiplier = 1#account_entry.related_object.is_a?(LedgerItem) ? -1 : 1

      if account_entry.related_object.is_a?(LedgerItem) && account_entry.related_object.related_object.is_a?(Payment)
        amount = multiplier * account_entry.amount
      else
        amount = multiplier * account_entry.amount
      end


      if amount < 0
        self.credit_amount += (-1 * amount)
        self.credit_count += 1
      else
        self.debit_amount += (-1 * amount)
        self.debit_count += 1
      end

      sum + (-1 * amount) # This is due to the nature of cash accounts
    end
  end

  def reconciliation_dates_do_not_overlap
    if begin_on && end_on
      # Check to be sure this unit isn't already leased for this time period
      existing_account_reconciliations = AccountReconciliation.where(company_id: self.company_id, bank_account_id: self.bank_account_id).where(["(:begin_on BETWEEN begin_on AND end_on) or (:end_on BETWEEN begin_on AND end_on)", {begin_on: self.begin_on, end_on: self.end_on}]).order(:end_on)
      existing_account_reconciliations = existing_account_reconciliations.where("account_reconciliations.id != #{self.id}") if self.id.present?

      if existing_account_reconciliations.exists?
        errors.add(:begin_on, "must be after existing reconciliation end (#{existing_account_reconciliations.last.end_on.strftime('%m/%d/%Y')})")
        errors.add(:end_on, "must be after existing reconciliation end (#{existing_account_reconciliations.last.end_on.strftime('%m/%d/%Y')})")
      elsif begin_on > end_on
        errors.add(:end_on, "must be after beginning date")
      end
    end
  end

  def reconciliation_dates_do_not_gap
    if begin_on && end_on
      existing_account_reconciliations = AccountReconciliation.where(company_id: self.company_id, bank_account_id: self.bank_account_id)

      if existing_account_reconciliations.count > 0 && !existing_account_reconciliations.where(end_on: begin_on - 1.day).exists?
        errors.add(:begin_on, "must be immediately after the previous reconciliation")
      end
    end
  end

  def difference_must_be_zero_to_close
    if is_closed? && difference != 0
      errors.add(:base, "Difference must be zero in order to close. Currently: #{number_to_currency(difference)}")
    end
  end

  def account_entries
    # Take the account_entry_object_ids, split them up and load all corresponding account entries
    entries_by_type = self.account_entry_object_ids.inject({}) do | acc, object_id |
      related_object_type = object_id.split(':').first
      related_object_id = object_id.split(':').last

      acc[related_object_type] ||= []
      acc[related_object_type] << related_object_id
      acc
    end

    # Build the OR queries
    account_entries = entries_by_type.keys.inject(AccountEntry.where('0=1')) do | acc, related_object_type |
      related_object_ids = entries_by_type[related_object_type]
      acc.or(AccountEntry.where(related_object_type: related_object_type, related_object_id: related_object_ids))
    end

    # Now, lock them down by bank_account.account_id
    account_entries.where(cash_account_id: bank_account.account_id).includes(:related_object)

  end

  def self.for_user(current_user)
    if current_user.present?
      AccountReconciliation.where(company_id: current_user.company_id).order(:begin_on)
    end
  end

  def self.public_fields
    [:hash_id, :bank_account_id, :begin_on, :end_on, :beginning_balance, :ending_balance, :account_entry_object_ids]
  end

  def self.private_fields
    [:id, :company_id, :status, :closed_at, :cleared_balance]
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.bank_account_name bank_account.name
      json.bank_account_type_pretty bank_account.account_type_pretty
      json.bank_account_type bank_account.account_type

      json.difference self.difference if self.is_closed?
    end
  end
end
