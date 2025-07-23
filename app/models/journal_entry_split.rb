class JournalEntrySplit < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::JournalEntry"}

  before_validation :ensure_amount

  belongs_to :journal_entry
  belongs_to :account
  has_many :journal_entry_split_items

  validates :account_id, presence: true
  validate :any_amount
  validate :no_amount_updates_if_reconciled
  def no_amount_updates_if_reconciled
    if amount_changed? && JournalEntrySplitItem.where(journal_entry_split_id: self.id).where.not(account_reconciliation_id: nil).exists?
      self.errors.add(:amount, "cannot be changed after entries are added to an Account Reconciliation")
    elsif account_id_changed? && JournalEntrySplitItem.where(journal_entry_split_id: self.id).where.not(account_reconciliation_id: nil).exists?
      self.errors.add(:account_id, "cannot be changed after entries are added to an Account Reconciliation")
    end
  end

  def account_name
    account.name if account_id.present?
  end

  def any_amount
    if (debit_amount.blank? || debit_amount == 0) && (credit_amount.blank? || credit_amount == 0)
      self.errors.add(:debit_amount, 'cannot be blank if credits is empty')
      self.errors.add(:credit_amount, 'cannot be blank if debits is empty')
    end
  end

  def ensure_amount
    if debit_amount.present?
      self.amount = BigDecimal(debit_amount) * -1
    elsif credit_amount.present?
      self.amount = credit_amount
    end
  end

  def force_destroy
    # If we are removing this ledger_item, we have to remove all related objects
    self.journal_entry_split_items.destroy_all()
    self.public_method(:destroy).super_method.call
  end

  attr_accessor :debit_amount, :credit_amount

  def self.public_fields
    [:id, :account_id, :debit_amount, :credit_amount, :description]
  end

  def self.private_fields
    [:account_reconciliation_id]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each { | field | json.(self, field) }
      self.class.private_fields().each { | field | json.(self, field) }
      json.debit_amount (self.amount.present? && self.amount < 0 ? self.amount.abs : nil)
      json.credit_amount (self.amount.present? && self.amount > 0 ? self.amount : nil)
    end
  end
end
