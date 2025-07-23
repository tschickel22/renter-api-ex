class ExpenseAccountSplit < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Expense"}

  belongs_to :expense
  belongs_to :account

  validates :account_id, presence: true
  validates :amount, numericality: {greater_than: 0}, presence: true
  validates :miles, numericality: {greater_than: 0}, presence: true, if: :is_mileage?

  def is_mileage?
    account&.code == Account::CODE_MILEAGE
  end

  def account_name
    account.name if account_id.present?
  end

  def self.public_fields
    [:id, :account_id, :amount, :miles]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each { | field | json.(self, field) }
    end
  end
end
