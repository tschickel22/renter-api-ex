class AccountEntry < PermanentRecord
  belongs_to :company
  belongs_to :property
  belongs_to :unit
  belongs_to :accrual_account, class_name: "Account"
  belongs_to :cash_account, class_name: "Account"
  belongs_to :related_object, polymorphic: true

  def related_object_type_and_id
    "#{related_object_type}:#{related_object_id}"
  end

  def self.public_fields
    [:id, :entry_on, :amount]
  end

  def self.private_fields
    [:related_object_type_and_id]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.property_name property.name if property.present?

      if related_object_type == LedgerItem.to_s
        # Ledger Items are one step away from what we're after... a Payment or PaymentReturn
        json.transaction_type related_object.related_object_type.humanize

        if related_object.related_object.is_a?(PaymentReturn)
          json.related_object_hash_id "Return:#{related_object.related_object_id}"
          json.transaction_type "Payment Return"
          json.description "Payment Return ##{related_object.related_object.hash_id}"

        elsif related_object.related_object.respond_to?(:deposit_item) && related_object.related_object.deposit_item.present?
          json.related_object_hash_id "Deposit:#{related_object.related_object.deposit_item.deposit_id}"
          json.description "Deposit ##{related_object.related_object.deposit_item.deposit_id}"

        elsif related_object.related_object.is_a?(Payment)
          json.related_object_hash_id "Payment:#{related_object.related_object_id}"
          json.transaction_type "Check Payment"
          json.description "Payment ##{related_object.related_object.hash_id}"

        elsif related_object.related_object.is_a?(Charge)
          json.related_object_hash_id "Charge:#{related_object.related_object_id}"

          if !related_object.related_object.description.blank?
            json.description related_object.related_object.description
            json.transaction_type "Refund" if related_object.related_object.description.include?("Refund")
          end
        else
          json.related_object_hash_id "Unknown:#{related_object.related_object_id}"
        end

      elsif related_object_type == Expense.to_s
        json.transaction_type "Expense"
        json.related_object_hash_id related_object.hash_id

        description = []
        description << "#{related_object.vendor&.name}" if related_object.vendor.present?
        description << related_object.description if !related_object.description.blank?

        json.description description.join(": ")

      elsif related_object_type == JournalEntrySplitItem.to_s
        json.transaction_type "Journal Entry"
        json.description (!self.description.blank? ? self.description : "Journal Entry ##{related_object.journal_entry.hash_id}")
        json.related_object_hash_id related_object.journal_entry.hash_id
      end
    end
  end
end
