class Account < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  before_validation :ensure_unique_code

  belongs_to :company
  has_one :bank_account
  belongs_to :account_category

  METHOD_ACCRUAL = 'accrual'
  METHOD_CASH = 'cash'

  TYPE_ASSETS = 'assets'
  TYPE_EXPENSES = 'expenses'
  TYPE_INCOME = 'income'
  TYPE_LIABILITY = 'liability'
  TYPE_EQUITY = 'equity'

  CODE_BANK_CHECKING_ACCOUNT = BigDecimal('100')
  CODE_BANK_SAVINGS_ACCOUNT = BigDecimal('105')
  CODE_BANK_CREDIT_CARD = BigDecimal('225')
  CODE_SECURITY_DEPOSITS_ACCOUNT = BigDecimal('135')

  CODE_OPENING_BALANCE_ACCOUNT = BigDecimal('300')

  CODE_ACCOUNTS_RECEIVABLE = BigDecimal('199')
  CODE_ACCOUNTS_PAYABLE = BigDecimal('220')
  CODE_FEES = BigDecimal('412')
  CODE_RENTAL_INCOME = BigDecimal('412')
  CODE_DEPOSITS_HELD = BigDecimal('235')
  CODE_MERCHANT_ACCOUNT_FEES = BigDecimal('518')
  CODE_OTHER_INCOME = BigDecimal('431')
  CODE_MILEAGE = BigDecimal('580')

  PROTECTED_CODES = [Account::CODE_BANK_CHECKING_ACCOUNT, Account::CODE_BANK_SAVINGS_ACCOUNT, Account::CODE_BANK_CREDIT_CARD, Account::CODE_SECURITY_DEPOSITS_ACCOUNT, Account::CODE_ACCOUNTS_RECEIVABLE, Account::CODE_RENTAL_INCOME, Account::CODE_DEPOSITS_HELD, Account::CODE_MERCHANT_ACCOUNT_FEES, Account::CODE_OTHER_INCOME, Account::CODE_MILEAGE, Account::CODE_OPENING_BALANCE_ACCOUNT]

  validates :code, presence: true, uniqueness: {scope: :company_id}
  validates :name, presence: true, uniqueness: {scope: [:code, :company_id]}
  validates :account_type, presence: true
  validates :account_category_id, presence: true

  attr_accessor :balance

  def primary_bank_account
    BankAccount.where(account_id: self.id).order(:property_id).first
  end

  def self.build_out_for_company(company)
    if !Account.where(company_id: company.id).exists?
      system_accounts = Account.where(company_id: nil)
      system_accounts.each do | system_account |
        new_account = system_account.clone_for_company(company)
        new_account.save
      end
    else
      raise "Accounts are already set up for #{company.name}"
    end
  end

  def clone_for_company(company)
    company_account_attrs = self.attributes.except("id", "created_at", "updated_at")
    company_account_attrs[:company_id] = company.id
    Account.new(company_account_attrs)
  end

  def self.for_user(current_user)
    if current_user.present?
      Account.where(company_id: current_user.company_id).order(:code)
    end
  end

  def destroy
    # System accounts cannot be deleted
    if company_id.present?
      super
    end
  end

  def company_bank_account
    return BankAccount.where(account_id: self.id).order(:property_id).first
  end

  def ensure_unique_code
    if new_record?
      if Account.where(code: self.code, company_id: self.company_id).exists?
        # How many are there?  If there are 10, we need to go to the hundredths place
        matching_codes = Account.where(company_id: company_id).where("code like '%#{code.to_s.split(".").first}%'").pluck(:code)

        # Increment by tenths.
        if matching_codes.count < 10
          while matching_codes.include?(self.code)
            self.code = self.code + BigDecimal("0.1")
          end
        # Unless there are 10+... then we need to move to one-hundredths
        else
          while matching_codes.include?(self.code)
            self.code = self.code + BigDecimal("0.01")
          end
        end
      end
    end
  end

  def self.public_fields
    [:code, :name, :account_category_id, :description]
  end

  def self.private_fields
    [:id, :account_type]
  end

  def to_builder(level = "partial")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      # Don't show .0 for code
      if code.to_s.slice(-2,2) == ".0"
        json.code code.to_s.split(".").first
      end

      # This helps with display * sorting
      json.category_name self.account_category.parent_account_category.present? ? self.account_category.parent_account_category.name : self.account_category.name
      json.sub_category_name self.account_category.parent_account_category.present? ? self.account_category.name : ""

      json.balance (self.balance || 0.0)
      json.account_category account_category.to_builder("full").attributes!

      if level == "full"
        json.bank_account_hash_id company_bank_account&.hash_id
      end
    end
  end
end