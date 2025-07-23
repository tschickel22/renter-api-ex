class Deposit < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Expense"}
  belongs_to :company
  belongs_to :bank_account
  has_many :deposit_items
  has_one :bank_transaction, as: :related_object

  before_create :generate_hash

  def self.for_user(current_user)
    if current_user.present?
      self.where(company_id: current_user.company_id)
    else
      self.where("0=1")
    end
  end

  def assignment_for_bank_transaction(_source_account_id = nil)
      "Deposit"
  end

  def description_for_bank_transaction
    "Deposit"
  end

  def paid_on
    deposit_on
  end

  def self.public_fields
    []
  end

  def self.private_fields
    [:id, :deposit_on, :amount, :paid_on]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each { | field | json.(self, field) }
      self.class.private_fields().each { | field | json.(self, field) }

      json.type Deposit.to_s
      json.paid_on deposit_on
      json.assignment_for_bank_transaction assignment_for_bank_transaction()
      json.description_for_bank_transaction description_for_bank_transaction()
      json.description "Deposit to x#{account_number}"
    end
  end
end
