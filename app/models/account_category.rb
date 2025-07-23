class AccountCategory < PermanentRecord
  belongs_to :parent_account_category, class_name: "AccountCategory"

  BANK_ACCOUNTS = 1
  CREDIT_CARDS = 21

  def self.for_user(_user)
    AccountCategory.all # No company-specific categories yet
  end

  def self.public_fields
    [:name, :account_type]
  end

  def self.private_fields
    [:id]
  end

  def to_builder(level = "partial")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      if level == "full"
        json.parent_account_category parent_account_category.to_builder("full").attributes! if parent_account_category.present?
      end
    end
  end
end