class PrintedCheck < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}
  before_create :generate_hash

  belongs_to :company
  belongs_to :bank_account
  belongs_to :related_object, polymorphic: true

  validates :check_number, presence: true, if: :need_check_number
  validate :check_number_not_reused, if: :need_check_number

  attr_accessor :need_check_number

  STATUS_QUEUED = 'queued'
  STATUS_PRINTED = 'printed'

  def self.create_for_expense_payment(expense_payment)
    printed_check = PrintedCheck.where(company_id: expense_payment.company_id, related_object: expense_payment).first_or_initialize

    printed_check.bank_account_id = expense_payment.from_account.primary_bank_account.id
    printed_check.status ||= PrintedCheck::STATUS_QUEUED
    printed_check.check_number = expense_payment.extra_info
    printed_check.paid_to = expense_payment.expense.vendor.name
    printed_check.amount = expense_payment.amount
    printed_check.memo = "Invoice ##{expense_payment.expense.invoice_number}"
    printed_check.description = expense_payment.expense.description

    printed_check.save

    return printed_check
  end

  def is_queued?
    self.status == PrintedCheck::STATUS_QUEUED
  end

  def is_printed?
    self.status == PrintedCheck::STATUS_PRINTED
  end

  def destroy

    # Update Balances
    if self.related_object.is_a?(ExpensePayment)
      self.related_object.update({ status: Payment::STATUS_FAILED, extra_info: nil })
      self.related_object.expense.save if self.related_object.expense.present?

      # Update ledger description
    elsif self.related_object.is_a?(ResidentLedgerItem)
      self.related_object.related_object.update(description: nil)
    end

    # Update bank account check numbers
    if self.check_number && self.bank_account.present?
      max_check_number = PrintedCheck.where(bank_account_id: self.bank_account_id, status: PrintedCheck::STATUS_PRINTED).collect{|c| c.check_number.to_i}.max

      self.bank_account.update(check_number: max_check_number)
    end

    # Push to ledger
    if self.related_object.is_a?(ExpensePayment)
      AccountingService.generate_entries_for_expense(self.related_object.expense) if self.related_object.expense.present?
    elsif self.related_object.is_a?(ResidentLedgerItem)
      AccountingService.generate_entries_for_refunded_deposit(self)
    end

    super
  end

  def self.for_user(current_user)
    if current_user.present?
      PrintedCheck.where(company_id: current_user.company_id)
    end
  end

  def check_number_not_reused
    if !self.check_number.blank? && PrintedCheck.where.not(id: self.id).where(bank_account_id: self.bank_account_id, check_number: self.check_number).exists?
      errors.add(:check_number,"number already used")
    end
  end

  def self.public_fields
    [:amount, :check_number]
  end

  def self.private_fields
    [:id, :hash_id, :bank_account_id, :printed_on, :memo, :paid_to, :status, :related_object_type, :description]
  end


  def to_builder(_level = nil)
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.from_account_id bank_account&.account_id
      json.related_object_hash_id related_object&.hash_id

    end
  end
end
