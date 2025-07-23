class BankTransaction < ApplicationRecord

  before_save :update_status

  belongs_to :company
  belongs_to :property
  belongs_to :bank_account
  belongs_to :related_object, polymorphic: true

  STATUS_NEW = 'new'
  STATUS_CATEGORIZED = 'categorized'
  STATUS_EXCLUDED = 'excluded'
  STATUS_OPTIONS = {BankTransaction::STATUS_NEW => 'New', BankTransaction::STATUS_CATEGORIZED => 'Categorized', BankTransaction::STATUS_EXCLUDED => 'Excluded'}

  def company_or_property_name
    if property_id.present?
      property.name
    else
      company.name
    end
  end

  def is_new?
    self.status == BankTransaction::STATUS_NEW
  end

  def is_categorized?
    self.status == BankTransaction::STATUS_CATEGORIZED
  end

  def is_excluded?
    self.status == BankTransaction::STATUS_EXCLUDED
  end

  def self.for_user(current_user)
    if current_user.present?
      BankTransaction.where(company_id: current_user.company_id)
    else
      BankTransaction.where("0=1")
    end
  end

  def update_status
    if status.nil?
      self.status = BankTransaction::STATUS_NEW
    elsif related_object_id.present? && self.is_new?
      self.status = BankTransaction::STATUS_CATEGORIZED
    end
  end

  def possible_bank_accounts
    if self.bank_account&.account_id.present?
      BankAccount.where(company_id: self.company_id, account_id: self.bank_account&.account_id)
    else
      BankAccount.where(company_id: self.company_id, id: self.bank_account_id)
    end
  end

  def self.public_fields
    [:description, :amount, :transacted_at]
  end

  def self.private_fields
    [:id, :company_or_property_name, :related_object_type, :status]
  end

  def to_builder(level = nil)
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.from_account_id bank_account&.account_id
      json.related_object_hash_id related_object&.hash_id

      # Should we dig into the related object and get more details?
      if level == "full"
        if self.related_object.present?
          if self.related_object.is_a?(Expense) || self.related_object.is_a?(JournalEntry) || self.related_object.is_a?(Deposit)
            json.related_object_assignment self.related_object.assignment_for_bank_transaction(bank_account&.account_id)
            json.related_object_description self.related_object.description_for_bank_transaction()
            json.related_object_date self.related_object.paid_on
            json.related_object_amount self.related_object.amount
          end
          if self.related_object.is_a?(Expense)
            json.related_object_vendor_id self.related_object.vendor_id

            if self.related_object.expense_account_splits.present?
              json.related_object_account_splits self.related_object.expense_account_splits.collect{|eas| eas.to_builder.attributes!}
            end
          end
        end
      end
    end
  end
end
