class Charge < ApplicationRecord
  include ApplicationHelper
  has_paper_trail versions: {class_name: "Versions::Lease"}

  before_create :generate_hash

  belongs_to :company
  belongs_to :property
  belongs_to :lease
  belongs_to :charge_type

  FREQUENCY_ONE_TIME = 'one_time'
  FREQUENCY_MONTHLY = 'monthly'
  FREQUENCY_OPTIONS = { Charge::FREQUENCY_ONE_TIME => 'One-Time', Charge::FREQUENCY_MONTHLY => 'Monthly'}

  validates :property_id, presence: true
  validates :lease_id, presence: true
  validates :charge_type_id, presence: true
  validates :due_on, presence: true, if: :is_one_time?
  validates :frequency, presence: true, inclusion: [Charge::FREQUENCY_ONE_TIME, Charge::FREQUENCY_MONTHLY]
  validates :prorated, inclusion: [false, true], if: :is_monthly?
  validates :amount, presence: true#, numericality: {greater_than: 0}

  attr_accessor :send_resident_payment_link, :prorated_amount, :backdated

  scope :proposed, -> { where(proposed: true) }
  scope :active, -> { where(deactivated_at: nil)}

  def is_one_time?
    frequency == Charge::FREQUENCY_ONE_TIME
  end

  def is_monthly?
    frequency == Charge::FREQUENCY_MONTHLY
  end

  def is_deposit?
    charge_type_id == ChargeType::DEPOSIT
  end

  def is_rent?
    charge_type_id == ChargeType::RENT
  end

  # When charges are posted to the ledger, the deposit must be considered first on that day
  def ledger_offset
    12.hours + (is_deposit? ? 0 : (is_rent? ? 1 : 10 + charge_type_id)).seconds
  end

  def description_pretty
    return description if !description.blank? && is_deposit?
    return "#{charge_type.name}#{description.blank? ? '' : ': '}#{description}" if charge_type.present?
    return description
  end

  def due_in_future
    if due_on.present? && due_on < todays_date() && amount > 0 # Adjustments can occur in the past
      errors.add(:due_on, "Must be today or in the future")
    end
  end

  def calculate_proration(settings, from_date, to_date)
    days_in_month = settings.present? && settings.prorate_type == "actual_month" ? to_date.end_of_month.day.to_f : 30.0

    if prorated
      self.prorated_amount = amount * ((1 + (to_date - from_date).to_i) / days_in_month)
      self.prorated_amount = amount if self.prorated_amount > amount # Can't go over
    else
      self.prorated_amount = amount
    end
  end

  def self.for_user(current_user)
    if current_user.is_company_admin?
      Charge.where(company_id: current_user.company_id)
    else
      Charge.where(lease: Lease.for_user(current_user))
    end
  end

  def destroy
    ResidentLedgerItem.where(related_object: self).where(["transaction_at > :todays_date", {todays_date: PaymentService.todays_date() + 12.hours}]).each{|rli| rli.force_destroy}
    self.update_attribute(:deactivated_at, Time.now) if self.deactivated_at.nil?
  end

  def force_destroy
    # If we are removing this charge, we have to remove all related objects
    ResidentLedgerItem.where(related_object: self).each{|rli| rli.force_destroy}

    self.public_method(:destroy).super_method.call
  end

  def self.public_fields
    [:hash_id, :property_id, :lease_id, :charge_type_id, :description, :frequency, :prorated, :amount, :due_on, :proposed]
  end

  def self.private_fields
    [:type]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.description_pretty description_pretty
      json.prorated_amount prorated_amount
    end
  end
end