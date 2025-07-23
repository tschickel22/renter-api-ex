class TaxReporting < ParanoidRecord
  belongs_to :company
  belongs_to :related_object, polymorphic: true

  before_create :generate_hash

  STATUS_NOT_SUBMITTED = "not_submitted"
  STATUS_SUBMITTED = "submitted"
  STATUS_ERROR = "error"
  STATUS_OPTIONS = {TaxReporting::STATUS_NOT_SUBMITTED => "Not Submitted", TaxReporting::STATUS_SUBMITTED => "Submitted", TaxReporting::STATUS_ERROR => "Error"}

  TAX_ID_TYPE_EIN = "ein"
  TAX_ID_TYPE_SSN = "ssn"

  scope :eligible_for_reporting, -> { where("(related_object_type = '#{Vendor.to_s}' AND amount_paid >= 600) OR (related_object_type = '#{PropertyOwner.to_s}' AND (rental_income + other_income) >= 600)") }

  def self.ensure_record(current_user, payee)
    tax_reporting = TaxReporting.where(company_id: current_user.company_id, report_year: TaxReporting.current_report_year, related_object: payee).first_or_initialize

    if tax_reporting.new_record?
      tax_reporting.status = TaxReporting::STATUS_NOT_SUBMITTED
      tax_reporting.calculate_amounts()

      tax_reporting.save
    end

    return tax_reporting
  end

  def self.years
    if Rails.env.production?
      (2024..current_report_year).to_a
    else
      (2023..current_report_year).to_a
    end
  end

  def self.current_report_year
    Date.today.year - 1
  end

  def self.for_user(current_user)
    if current_user.present?
      self.where(company_id: current_user.company_id)
    end
  end

  def related_object_type_and_id
    "#{related_object_type}:#{related_object_id}"
  end

  def status_pretty
    label_lookup(status, TaxReporting::STATUS_OPTIONS)
  end

  def total
    (amount_paid + rental_income + other_income)
  end

  def self.public_fields
    [:amount_paid, :rental_income, :other_income]
  end

  def self.private_fields
    [:id, :company_id, :report_year, :hash_id, :related_object_type_and_id, :related_object_type, :related_object_id, :status, :status_pretty, :total, :external_url]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.payee_name related_object&.name
    end
  end

  def calculate_amounts
    self.rental_income = 0
    self.other_income = 0
    self.amount_paid = 0

    if related_object.is_a?(PropertyOwner)
      rental_income_account = company.accounts.where(code: Account::CODE_RENTAL_INCOME).first
      other_income_accounts = company.accounts.where.not(id: rental_income_account).where(account_type: Account::TYPE_INCOME).where("name NOT LIKE '%Utilities%'")

      related_object.property_ownerships.each do | property_ownership |
        self.rental_income += AccountEntry.where(company_id: company_id, property_id: property_ownership.property_id, cash_account: rental_income_account).where("year(entry_on) = #{report_year}").sum(:amount) * property_ownership.percentage / 100.0
        self.other_income += AccountEntry.where(company_id: company_id, property_id: property_ownership.property_id, cash_account: other_income_accounts).where("year(entry_on) = #{report_year}").sum(:amount) * property_ownership.percentage / 100.0
      end

    elsif related_object.is_a?(Vendor)
      self.amount_paid = Expense.where(vendor: related_object).where("year(paid_on) = #{report_year}").sum(:amount)
    end
  end
end