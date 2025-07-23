class BankAccount < PermanentRecord
  has_paper_trail versions: {class_name: "Versions::Company"}
  include ApplicationHelper

  before_create :generate_hash
  before_validation :ensure_name
  before_save :ensure_account

  belongs_to :company
  belongs_to :property
  belongs_to :account
  has_many :deposits
  has_many :bank_transactions, -> { order(:transacted_at)}

  ACCOUNT_PURPOSE_OPERATING = 'operating'
  ACCOUNT_PURPOSE_EXPENSES = 'expenses'
  ACCOUNT_PURPOSE_DEPOSIT = 'deposit'

  ACCOUNT_TYPE_CHECKING = 'checking'
  ACCOUNT_TYPE_SAVINGS = 'savings'
  ACCOUNT_TYPE_CREDIT_CARD = 'credit_card'
  ACCOUNT_TYPE_OPTIONS = {BankAccount::ACCOUNT_TYPE_SAVINGS => "Savings", BankAccount::ACCOUNT_TYPE_CHECKING => "Checking", BankAccount::ACCOUNT_TYPE_CREDIT_CARD => "Credit Card"}

  attr_accessor :account_number_confirmation, :in_account_setup

  validates :account_type, presence: true
  validates :name, presence: true, unless: :is_operating_or_deposit?
  validates :routing_number, presence: true, if: :is_operating_or_deposit?
  validates :account_number, presence: true, if: :is_operating_or_deposit?
  validate :account_number_matches_confirmation, if: :new_record?

  validates :name, presence: true, if: :in_account_setup
  validate :opened_on_is_valid, if: :in_account_setup
  validates :opening_balance, presence: true, if: :in_account_setup

  attr_encrypted :routing_number, key: Rails.application.credentials.dig(:renter_insight_field_key)
  attr_encrypted :account_number, key: Rails.application.credentials.dig(:renter_insight_field_key)

  def nickname
    if !name.blank?
      return name
    else
      "#{label_lookup(account_type, BankAccount::ACCOUNT_TYPE_OPTIONS)} Account xx-#{account_number.slice(-4,4)}"
    end
  end

  def is_operating_or_deposit?
    account_purpose == BankAccount::ACCOUNT_PURPOSE_OPERATING || account_purpose == BankAccount::ACCOUNT_PURPOSE_DEPOSIT
  end

  def account_number_matches_confirmation
    if account_number && account_number != account_number_confirmation
      errors.add(:account_number_confirmation, "does not match account number")
    end
  end

  def account_type_pretty
    label_lookup(account_type, BankAccount::ACCOUNT_TYPE_OPTIONS)
  end

  def opened_on_is_valid
    if opened_on.blank?
      errors.add(:opened_on, "can't be blank")
    elsif opened_on > PaymentService.todays_date()
      errors.add(:opened_on, "must be in the past")
    end
  end

  def self.find_bank_account_for_refund(lease)
    bank_account = BankAccount.where(company_id: lease.company_id, property_id: nil, account_purpose: BankAccount::ACCOUNT_PURPOSE_DEPOSIT).first

    # If not deposit account was specified, wind our way back through the property bank account
    if bank_account.nil?
      property_bank_account = BankAccount.where(company_id: lease.company_id, property_id: lease.property_id).first
      bank_account =  BankAccount.where(company_id: lease.company_id, property_id: nil, account_id: property_bank_account.account_id).first if property_bank_account.present?

      # If no company-level account exists, just use property_bank_account
      bank_account ||= property_bank_account
    end

    return bank_account
  end

  def self.for_user(current_user)
    if current_user
      BankAccount.where(company_id: current_user.company_id)
    else
      BankAccount.where("1=0")
    end
  end

  def update_unconfirmed_transactions
    self.unconfirmed_transactions = self.bank_transactions.where(related_object_id: nil).count
  end

  def self.public_fields
    [:id, :name, :property_id, :account_type, :routing_number, :account_number, :account_number_confirmation, :account_purpose, :opened_on, :opening_balance, :reconciled_until,
     :check_printing_enabled, :check_company_name, :check_company_street, :check_company_city, :check_company_state, :check_company_zip, :check_company_phone,
     :check_format, :check_signature_heading, :check_aba_fractional_number, :check_bank_name, :check_bank_city, :check_bank_state, :check_signor_name,
     :balance, :transactions_refreshed_at, :unconfirmed_transactions]
  end

  def self.private_fields
    [:hash_id, :company_id, :external_id, :external_stripe_id, :account_id, :check_number]
  end

  def ensure_name
    if self.name.blank? && self.account.present?
      self.name = self.account.name
    end
  end

  def ensure_account
    # A bank account can be tied to one of three GL accounts:
    # 100 Bank Checking Account
    # 105 Bank Savings Account
    # 135 Refundable Security Deposits
    if self.account.nil?

      # Determine the necessary account_code
      if account_purpose == BankAccount::ACCOUNT_PURPOSE_OPERATING || account_purpose == BankAccount::ACCOUNT_PURPOSE_EXPENSES
        if account_type == BankAccount::ACCOUNT_TYPE_SAVINGS
          account_code = Account::CODE_BANK_SAVINGS_ACCOUNT
        elsif account_type == BankAccount::ACCOUNT_TYPE_CREDIT_CARD
          account_code = Account::CODE_BANK_CREDIT_CARD
        else
          account_code = Account::CODE_BANK_CHECKING_ACCOUNT
        end
      elsif account_purpose == BankAccount::ACCOUNT_PURPOSE_DEPOSIT
        account_code = Account::CODE_SECURITY_DEPOSITS_ACCOUNT
      end

      if self.property_id.present?
        # Look through existing accounts to see if there is already an account created
        BankAccount.where(company_id: company_id, account_type: account_type).where.not(id: self.id).each do | existing_bank_account |
          if !self.account_number.blank? && existing_bank_account.account_number == self.account_number
            self.account = existing_bank_account.account
          end
        end
      end

      if self.account.nil?
        # Look for an un-associated account
        existing_account = Account.where(company_id: company_id, code: account_code).first

        if existing_account.present? && !BankAccount.where(account: existing_account).exists?
          self.account = existing_account
        else
          existing_account = Account.where(company_id: company_id, code: account_code, name: self.nickname).first

          if existing_account.present?
            self.account = existing_account
          else
            system_account = Account.where(company_id: nil, code: account_code).first
            self.account = system_account.clone_for_company(company)
          end
        end
      end

      self.account.name = self.nickname

      if !self.account.save
        raise self.account.errors.full_messages.join(", ")
      end
    end
  end

  def to_builder
    Jbuilder.new do |json|

      json.nickname nickname

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end
    end
  end
end