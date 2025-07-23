class BulkCharge < ParanoidRecord
  include ApplicationHelper
  before_create :generate_hash
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :company
  has_many :bulk_charge_leases

  accepts_nested_attributes_for :bulk_charge_leases, allow_destroy: true

  validates :charge_type_id, presence: true
  validates :due_on, presence: true
  validates :end_on, presence: true, if: :is_monthly?
  validates :frequency, presence: true, inclusion: [Charge::FREQUENCY_ONE_TIME, Charge::FREQUENCY_MONTHLY]
  validates :prorated, inclusion: [false, true], if: :is_monthly?
  validates :amount, presence: true, numericality: {greater_than: 0}, if: :same_for_all
  validates :description, presence: true, if: :same_for_all
  validate :due_in_future, if: [:is_one_time?, :new_record?]

  def self.for_user(current_user)
    BulkCharge.where(company_id: current_user.company_id)
  end

  def is_one_time?
    frequency == Charge::FREQUENCY_ONE_TIME
  end

  def is_monthly?
    frequency == Charge::FREQUENCY_MONTHLY
  end

  def created_at_pretty
    created_at.strftime('%m/%d/%Y') if created_at.present?
  end

  def frequency_pretty
    label_lookup(frequency, Charge::FREQUENCY_OPTIONS)
  end

  def due_in_future
    if due_on.present? && due_on < PaymentService.todays_date() && amount > 0 # Adjustments can occur in the past
      errors.add(:due_on, "Must be today or in the future")
    end
  end

  def generate_charges
    self.bulk_charge_leases.each do | bulk_charge_lease |
      charge = ResidentCharge.where(bulk_charge_id: self.id, company_id: self.company_id, property_id: bulk_charge_lease.property_id, lease_id: bulk_charge_lease.lease_id).first_or_initialize

      charge.amount = bulk_charge_lease.calculate_amount
      charge.description = bulk_charge_lease.calculate_description
      charge.charge_type_id = self.charge_type_id
      charge.due_on = [self.due_on, PaymentService.todays_date()].max
      charge.frequency = self.frequency
      charge.prorated = self.prorated

      if charge.save
        AccountingService.push_to_ledger(charge)
      else
        raise "Could not generate charge: #{charge.errors.full_messages}"
      end
    end
  end

  def destroy
    # If we are removing this ledger_item, we have to remove all related objects
    Charge.where(bulk_charge_id: self.id).each{|c| c.force_destroy}
    super
  end

  def status_pretty
    if due_on > Date.today
      "Scheduled"
    else
      "Charged"
    end
  end

  def self.public_fields
    [:frequency, :charge_type_id, :due_on, :end_on, :amount, :description, :same_for_all, :prorated]
  end

  def self.private_fields
    [:hash_id, :created_at, :created_at_pretty, :frequency_pretty, :status_pretty]
  end

  def to_builder
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.bulk_charge_leases bulk_charge_leases.collect{|bcl| bcl.to_builder.attributes!}
    end
  end

end
