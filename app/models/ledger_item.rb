class LedgerItem < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::JournalEntry"}
  before_create :generate_hash

  belongs_to :property
  belongs_to :lease
  belongs_to :related_object, polymorphic: true

  attr_accessor :balance, :open_amount

  validates :amount, presence: true
  validates :transaction_at, presence: true

  scope :future, -> { where(["cast(convert_tz(transaction_at, 'UTC', 'US/Mountain') AS date) >= :today", {today: PaymentService.todays_date()}]) }

  def self.future_as_of
    Rails.env.production? ? 7.days.from_now : 7.days.from_now
  end

  def self.as_of(date = nil)

    # Show what is due in the next week by default
    date ||= future_as_of()

    LedgerItem.where(["cast(convert_tz(transaction_at, 'UTC', 'US/Mountain') AS date) <= :as_of_date", {as_of_date: date}])
  end

  def self.between(after_date, until_date)
    LedgerItem.where(["cast(convert_tz(transaction_at, 'UTC', 'US/Mountain') AS date) > :after_date AND cast(convert_tz(transaction_at, 'UTC', 'US/Mountain') AS date) <= :until_date", {after_date: after_date, until_date: until_date}])
  end

  def is_charge
    related_object_type == Charge.to_s
  end

  def is_payment
    related_object_type == Payment.to_s
  end

  def is_payment_return
    related_object_type == PaymentReturn.to_s
  end

  def description_pretty
    if related_object.respond_to?(:description_pretty)
      related_object.description_pretty
    else
      related_object_type
    end
  end

  def self.for_user(current_user)
    ResidentLedgerItem.joins(:property).where(property: Property.for_user(current_user).active)
  end

  def force_destroy
    # If we are removing this ledger_item, we have to remove all related objects
    AccountEntry.where(related_object: self).each{|ae| ae.force_destroy}
    self.destroy
  end

  def self.public_fields
    [:hash_id, :amount, :transaction_at]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)

        json.charge_id related_object.hash_id if is_charge
        json.payment_return_id related_object.hash_id if is_payment_return

        if is_payment
          json.payment_id related_object.hash_id
          json.refundable related_object.eligible_for_return?
          # NOT READY json.editable (related_object.status == Payment::STATUS_MANUAL)
          json.deletable (related_object.status == Payment::STATUS_MANUAL)
        elsif is_charge
          json.editable true
          #json.deletable (related_object.is_one_time? && balance.present? && balance > 0)
        end

        json.type related_object_type
        json.description related_object.description_pretty
        json.balance balance
        json.open_amount open_amount
      end
    end
  end
end
