class PaymentMethod < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}

  belongs_to :resident
  belongs_to :company

  before_create :generate_hash

  METHOD_ACH = 'ach'
  METHOD_CREDIT_CARD = 'credit_card'
  METHOD_DEBIT_CARD = 'debit_card'
  METHOD_CASH = 'cash'

  METHOD_OPTIONS = {PaymentMethod::METHOD_ACH => 'ACH', PaymentMethod::METHOD_CREDIT_CARD => 'Credit Card', PaymentMethod::METHOD_DEBIT_CARD => 'Debit Card', PaymentMethod::METHOD_CASH => 'Cash Pay'}

  attr_accessor :credit_card_number, :credit_card_cvv, :ach_account_type, :ach_routing_number, :ach_account_number, :billing_agreement

  validates :method, presence: true
  validates :billing_first_name, presence: true
  validates :billing_last_name, presence: true

  validates :billing_street, presence: true, unless: :is_cash?
  validates :billing_city, presence: true, unless: :is_cash?
  validates :billing_state, presence: true, unless: :is_cash?
  validates :billing_zip, presence: true, unless: :is_cash?

  validate :credit_card_expiration, if: :is_credit_card?
  validates :credit_card_number, presence: true, if: :is_credit_card?
  validates :credit_card_cvv, presence: true, if: :is_credit_card?

  validates :ach_account_type, presence: true, if: :is_ach?
  validates :ach_routing_number, presence: true, if: :is_ach?
  validates :ach_account_number, presence: true, if: :is_ach?

  def is_ach?
    method == PaymentMethod::METHOD_ACH
  end

  def is_credit_card?
    method == PaymentMethod::METHOD_CREDIT_CARD
  end

  def is_debit_card?
    method == PaymentMethod::METHOD_DEBIT_CARD
  end

  def is_cash?
    method == PaymentMethod::METHOD_CASH
  end

  def credit_card_expiration
    if credit_card_expires_on.nil?
      errors.add('credit_card_expires_on', 'Enter in mm/yy format')
    elsif credit_card_expires_on < Date.today
      errors.add('credit_card_expires_on', 'Card has expired')
    end
  end

  def method_and_last_four
    str = "ACH" if is_ach?
    str = "Credit Card" if is_credit_card?
    str = "Debit Card" if is_debit_card?
    str = "Cash Pay" if is_cash?

    str += " (#{last_four})" if !last_four.blank?

    return str
  end

  def method_pretty
    return "ACH" if is_ach?
    return"Credit Card" if is_credit_card?
    return "Debit Card" if is_debit_card?
    return "Cash Pay" if is_cash?
  end

  def self.public_fields
    [:resident_id, :nickname,:method,:billing_first_name,:billing_last_name,:billing_street,:billing_street_2,:billing_city,:billing_state,:billing_zip,:last_four,:credit_card_expires_on]
  end

  def self.transient_fields
    [:credit_card_number, :credit_card_expires_on, :credit_card_cvv, :ach_account_type, :ach_routing_number, :ach_account_number]
  end

  def self.private_fields
    [:id, :hash_id, :external_id]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.private_fields().each do | field |
        json.(self, field)
      end

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      json.name nickname
      json.method_and_last_four method_and_last_four
      json.method_pretty method_pretty
      json.billing_agreement billing_agreement_at.present?
    end
  end
end