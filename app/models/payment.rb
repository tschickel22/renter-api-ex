class Payment < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Expense"}
  before_create :generate_hash

  belongs_to :payment_method
  belongs_to :company
  belongs_to :property
  belongs_to :lease
  belongs_to :resident
  belongs_to :expense
  has_one :payment_return
  has_one :deposit_item

  STATUS_NEW = 'new'
  STATUS_SUBMITTED = 'submitted'
  STATUS_PENDING = 'pending'
  STATUS_SUCCEEDED = 'succeeded'
  STATUS_FAILED    = 'failed'
  STATUS_MANUAL    = 'manual'
  STATUS_OPTIONS   = { Payment::STATUS_NEW => "New", Payment::STATUS_PENDING => "Pending", Payment::STATUS_SUBMITTED => "Submitted", Payment::STATUS_SUCCEEDED => "Succeeded", Payment::STATUS_FAILED => "Failed", Payment::STATUS_MANUAL => "Manual"}

  RESPONSIBILITY_RESIDENT = 'resident'
  RESPONSIBILITY_PROPERTY = 'property'

  validates :company_id, presence: true
  validates :amount, presence: true, numericality: {greater_than: 0}

  validates :property_id, presence: true, unless: :is_expense_payment?
  validates :lease_id, presence: true, unless: :is_expense_payment?
  validates :extra_info, presence: true, if: :is_manual?, unless: :is_expense_payment?

  scope :succeeded, -> { where(:status => [Payment::STATUS_SUCCEEDED])}
  scope :succeeded_or_manual, -> { where(:status => [Payment::STATUS_SUCCEEDED, Payment::STATUS_MANUAL])}

  def is_manual?
    status == Payment::STATUS_MANUAL
  end

  def eligible_for_return?
    status == Payment::STATUS_SUCCEEDED && payment_at >= (Date.today - 90.days) && payment_return.nil?
  end

  def payment_at_pretty
    payment_at.strftime('%m/%d/%Y') if payment_at.present?
  end

  def description_pretty
    "Payment ##{hash_id}"
  end

  def is_expense_payment?
    self.is_a?(ExpensePayment)
  end

  # Credit Card
  # $100 - if Resident is responsible, 3.25% + $2.95, rounded up to $0.95
  # $100 - if Property is responsible, 3.25%, rounded up to $0.95
  #
  # Debit Card
  # $100 - if Resident is responsible, $7.95
  # $100 - if Property is responsible, $7.95
  #
  # ACH
  # $100 - if Resident is responsible, $2.95
  # $100 - if Property is responsible, $0.75
  #
  def calculate_fees(payment_method_type, current_settings, setting_name)
    if payment_method_type == PaymentMethod::METHOD_ACH
      if current_settings["resident_responsible_#{setting_name}_ach"]
        self.fee_responsibility = Payment::RESPONSIBILITY_RESIDENT
        self.fee = current_settings.payment_fee_ach_resident
      else
        self.fee_responsibility = Payment::RESPONSIBILITY_PROPERTY
        self.fee = current_settings.payment_fee_ach_property
      end
    elsif payment_method_type == PaymentMethod::METHOD_DEBIT_CARD
      if current_settings["resident_responsible_#{setting_name}_debit_card"]
        self.fee_responsibility = Payment::RESPONSIBILITY_RESIDENT
        self.fee = current_settings.payment_fee_debit_card_resident

      else
        self.fee_responsibility = Payment::RESPONSIBILITY_PROPERTY
        self.fee = current_settings.payment_fee_debit_card_property
      end
    else
      if current_settings["resident_responsible_#{setting_name}_credit_card"]
        self.fee_responsibility = Payment::RESPONSIBILITY_RESIDENT
        self.fee = current_settings.payment_fee_ach_resident + self.amount * current_settings.payment_fee_credit_card_resident / 100.0
      else
        self.fee_responsibility = Payment::RESPONSIBILITY_PROPERTY
        self.fee = self.amount * current_settings.payment_fee_credit_card_property / 100.0
      end

      # Zego needs fees rounded to 95 cents
      self.fee = Payment.round_to_95(self.fee)
    end
  end

  def self.round_to_95(fee)
    # Find the cents
    cents = fee - fee.to_i
    dollar_amount = fee - cents

    if cents > 0.95
      dollar_amount + 1.95
    else
      dollar_amount + 0.95
    end
  end

  def force_destroy
    if is_manual?
      # If we are removing this charge, we have to remove all related objects
      resident_ledger_item = ResidentLedgerItem.where(related_object: self).first

      if resident_ledger_item.present?
        AccountEntry.where(related_object: resident_ledger_item).each{|ae| ae.force_destroy}
        resident_ledger_item.force_destroy
      end

      self.public_method(:destroy).super_method.call
    end
  end


  def self.public_fields
    [:amount, :extra_info, :from_account_id, :expense_payment_status]
  end

  def self.private_fields
    [:id, :hash_id, :external_id, :external_message, :external_processing_fee, :fee, :fee_responsibility, :payment_at, :payment_method_id, :status]
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
        json.payment_method payment_method.to_builder().attributes! if self.payment_method.present?
      end
    end
  end
end

