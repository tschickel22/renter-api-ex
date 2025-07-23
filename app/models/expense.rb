class Expense < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Expense"}

  before_create :generate_hash
  before_validation :set_due_on
  before_save :update_amount

  belongs_to :company
  belongs_to :maintenance_request
  belongs_to :payment_account, class_name: "Account"
  belongs_to :vendor
  belongs_to :employee_user, class_name: "User"

  attr_accessor :receipts_batch_number
  has_many_attached :receipts
  has_many :expense_payments
  has_many :expense_account_splits
  has_many :expense_property_splits
  has_one :bank_transaction, as: :related_object

  accepts_nested_attributes_for :expense_account_splits, allow_destroy: true
  accepts_nested_attributes_for :expense_property_splits, allow_destroy: true

  validates :paid_on, presence: true, if: :adding_expense?
  validates :description, presence: true, unless: :is_mileage?
  validates :vendor_id, presence: true, unless: :is_mileage?
  validates :payment_account_id, presence: true, if: :is_expense?
  validates :employee_user_id, presence: true, if: :is_mileage?
  validate :at_least_one_split

  scope :expenses, -> { where(type: Expense.to_s) }
  scope :bills, -> { where(type: Bill.to_s) }
  scope :unpaid, -> { where("amount_due > 0")}

  def at_least_one_split
    if expense_account_splits.empty?
      self.errors.add(:base, "You must enter a category and amount")
    end
  end

  def is_expense?
    self.type == Expense.to_s
  end

  def adding_expense?
    is_expense? && self.new_record?
  end

  def self.for_user(current_user)
    if current_user.present?
      self.where(company_id: current_user.company_id)
    else
      self.where("0=1")
    end
  end

  def is_mileage?
    !expense_account_splits.empty? && expense_account_splits.first.is_mileage?
  end

  def update_amount
    self.amount = expense_account_splits.inject(BigDecimal("0")) { |sum, split| sum + (split.amount || BigDecimal("0")) }

    if self.is_expense?
      self.amount_due = 0
    else
      self.amount_due = self.amount - expense_payments.succeeded_or_manual.inject(BigDecimal("0")) { |sum, payment| sum + (payment.amount || BigDecimal("0")) }

      if self.amount_due <= 0 && self.paid_on.nil?
        self.paid_on = PaymentService.todays_date()
      elsif self.amount_due > 0
        self.paid_on = nil
      end
    end
  end

  def ensure_expense_payment(force = false)
    if self.is_expense? || force
      if self.expense_payments.empty?
        payment = ExpensePayment.new()
        payment.company_id = self.company_id
        payment.expense_id = self.id
        payment.status = Payment::STATUS_MANUAL
        payment.expense_payment_status = ExpensePayment::STATUS_PAPER_CHECK_MANUAL
        payment.payment_at = (self.is_expense? ? self.paid_on + 12.hours : Time.now)
        payment.amount = self.amount
        payment.from_account_id = self.payment_account_id

        if !payment.save
          raise "Could not save expense payment: #{payment.errors.full_messages.join(", ")}"
        end

      else

        # Expenses should only have one associated payment... update that one with the amount
        expense_payment = self.expense_payments.first
        expense_payment.amount = self.amount
        expense_payment.payment_at = (self.is_expense? ? self.paid_on + 12.hours : Time.now)
        expense_payment.from_account_id = self.payment_account_id

        if !expense_payment.save
          raise "Could not save expense payment"
        end
      end

      self.reload
    end
  end

  def payment_status
    if (self.amount_due || 0) <= 0
      "Paid"
    elsif self.amount_due < self.amount
      "Partially Paid"
    elsif self.due_on >= PaymentService.todays_date()
      "Due"
    else
      "Past Due"
    end
  end

  def payment_status_sort
    if (self.amount_due || 0) <= 0
      4
    elsif self.amount_due < self.amount
      3
    elsif self.due_on < PaymentService.todays_date()
      2
    else
      1
    end
  end

  def assignment_for_bank_transaction(_source_account_id)
    if expense_account_splits.length == 1
      expense_account_splits.first.account_name
    elsif expense_account_splits.length == 0
      ""
    else
      "Multiple Accounts"
    end
  end

  def description_for_bank_transaction()
    self.description
  end

  def destroy
    AccountEntry.where(related_object: self).each{|ae| ae.force_destroy}
    super
  end

  # This is just an alias for destroy... for consistency
  def force_destroy
    destroy()
  end

  def self.public_fields
    [:type, :due_on, :paid_on, :invoice_number, :amount, :vendor_id, :payment_account_id, :employee_user_id, :maintenance_request_id, :description]
  end

  def self.private_fields
    [:id, :hash_id, :account_reconciliation_id, :amount_due, :payment_status, :payment_status_sort]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each { | field | json.(self, field) }
      self.class.private_fields().each { | field | json.(self, field) }

      json.vendor_name vendor.name if vendor_id.present?
      json.amount ensure_decimals(amount)
      json.amount_due ensure_decimals(amount_due)
      json.expense_account_splits expense_account_splits.collect{|eas| eas.to_builder.attributes!}
      json.expense_property_splits expense_property_splits.collect{|eps| eps.to_builder.attributes!}

      if expense_account_splits.length == 1
        json.account_name expense_account_splits.first.account_name
      else
        json.account_name "Multiple"
      end

      if expense_property_splits.length == 1
        json.property_name expense_property_splits.first.property_name
        json.street_and_unit expense_property_splits.first.street_and_unit
      else
        json.property_name "Multiple"
        json.street_and_unit "Multiple"
      end
    end
  end

  def self.receipt_builder(receipt)
    Jbuilder.new do |json|
      json.id receipt.id
      json.filename receipt.filename.to_s
      json.content_type receipt.content_type
      json.url Rails.application.routes.url_helpers.url_for(receipt)
    end
  end

  private

  def set_due_on
    if self.is_expense?
      self.due_on = self.paid_on
    end
  end
end
