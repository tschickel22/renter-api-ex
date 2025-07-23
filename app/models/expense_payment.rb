class ExpensePayment < Payment
  include ApplicationHelper
  belongs_to :expense
  belongs_to :from_account, class_name: "Account"

  validates :expense_id, presence: true
  validates :from_account_id, presence: true
  validates :expense_payment_status, presence: true
  validates :extra_info, presence: true, if: :need_check_number
  validate :check_number_not_reused, if: :need_check_number
  validate :bank_account_setup

  attr_accessor :need_check_number

  STATUS_CREDIT_CARD  = 'credit_card'
  STATUS_CASH  = 'cash'
  STATUS_ACH  = 'ach'
  STATUS_PAPER_CHECK_QUEUED  = 'paper_check_queued'
  STATUS_PAPER_CHECK_PRINTED = 'paper_check_printed'
  STATUS_PAPER_CHECK_MANUAL = 'paper_check_manual'
  STATUS_OPTIONS = { ExpensePayment::STATUS_PAPER_CHECK_QUEUED => "Queue for Check Printing", ExpensePayment::STATUS_PAPER_CHECK_PRINTED => "Check Printed", ExpensePayment::STATUS_PAPER_CHECK_MANUAL => "Handwritten Check", ExpensePayment::STATUS_CREDIT_CARD => "Credit Card", ExpensePayment::STATUS_CASH => "Cash"}

  def self.for_user(current_user)
    ExpensePayment.where(company_id: current_user.company_id)
  end

  def is_paper_check_queued?
    self.expense_payment_status == ExpensePayment::STATUS_PAPER_CHECK_QUEUED
  end

  def expense_payment_status_pretty
    parts = [label_lookup(self.expense_payment_status, ExpensePayment::STATUS_OPTIONS)]
    if [ExpensePayment::STATUS_PAPER_CHECK_QUEUED, ExpensePayment::STATUS_PAPER_CHECK_PRINTED, ExpensePayment::STATUS_PAPER_CHECK_MANUAL].include?(self.expense_payment_status)
      parts << "(Check ##{self.extra_info})"
    end

    return parts.join(" ")
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      if level == "full"
        json.expense_payment_status_pretty self.expense_payment_status_pretty
        json.expense expense.to_builder().attributes!
      end
    end
  end

  def check_number_not_reused
    if !self.extra_info.blank? && PrintedCheck.where.not(id: self.id).where(bank_account_id: self.from_account&.bank_account&.id, check_number: self.extra_info).exists?
      errors.add(:extra_info,"number already used")
    end
  end

  def bank_account_setup
    if is_paper_check_queued? && from_account.present?
      if from_account.primary_bank_account.nil?
        errors.add(:from_account_id, "No bank account associated with this account")
      elsif !from_account.primary_bank_account.check_printing_enabled
        errors.add(:from_account_id, 'Bank account not configured for check printing')
      end
    end
  end
end

