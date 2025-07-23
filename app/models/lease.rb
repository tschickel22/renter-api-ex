class Lease < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Lease"}

  before_create :generate_hash
  before_save :update_flags
  after_save :touch_unit

  belongs_to :company
  belongs_to :property
  belongs_to :unit
  belongs_to :screening_payment_method, class_name: 'CompanyPaymentMethod'
  belongs_to :security_deposit_refund_payment_method, class_name: 'ResidentPaymentMethod'

  has_one :primary_resident, class_name: 'LeaseResidentPrimary'
  has_one :next_lease, class_name: 'Lease', foreign_key: :previous_lease_id
  belongs_to :previous_lease, class_name: 'Lease'
  has_many :secondary_residents, class_name: 'LeaseResidentSecondary'

  has_many :guarantors, class_name: 'LeaseResidentGuarantor'
  has_many :minors, class_name: 'LeaseResidentMinor'
  has_many :occupants, class_name: 'LeaseResidentOccupant'
  has_many :lease_residents
  has_many :residents, through: :lease_residents
  has_many :resident_ledger_items, -> { order(:transaction_at) }
  has_many :resident_charges, -> { order(:id) }
  has_many :payments
  has_many :documents
  has_many :external_documents
  has_many_attached :move_out_documents
  has_many_attached :lease_documents

  accepts_nested_attributes_for :primary_resident
  accepts_nested_attributes_for :secondary_residents, allow_destroy: true
  accepts_nested_attributes_for :occupants, allow_destroy: true
  accepts_nested_attributes_for :minors, allow_destroy: true
  accepts_nested_attributes_for :guarantors, allow_destroy: true
  accepts_nested_attributes_for :screening_payment_method

  attr_accessor :lease_action

  APPLICATION_STATUS_LEAD = 'lead'
  APPLICATION_STATUS_NEW = 'new'
  APPLICATION_STATUS_IN_PROGRESS = 'in_progress'
  APPLICATION_STATUS_COMPLETED = 'completed'
  APPLICATION_STATUS_APPROVED = 'approved'
  APPLICATION_STATUS_DECLINED = 'declined'

  APPLICATION_STATUS_OPTIONS = {Lease::APPLICATION_STATUS_NEW => 'New', Lease::APPLICATION_STATUS_LEAD => 'Lead', Lease::APPLICATION_STATUS_IN_PROGRESS => 'In Progress', Lease::APPLICATION_STATUS_COMPLETED => 'Completed', Lease::APPLICATION_STATUS_APPROVED => 'Approved', Lease::APPLICATION_STATUS_DECLINED => 'Declined'}

  STATUS_LEAD = 'lead'
  STATUS_APPLICANT = 'applicant'
  STATUS_APPROVED = 'approved'
  STATUS_RENEWING = 'renewing'
  STATUS_FUTURE = 'future'
  STATUS_CURRENT = 'current'
  STATUS_FORMER = 'former'
  STATUS_CANCELLED = 'cancelled'
  STATUS_OPTIONS = {Lease::STATUS_LEAD => 'Lead', Lease::STATUS_APPLICANT => 'Applicant', Lease::STATUS_APPROVED => 'Approved', Lease::STATUS_RENEWING => 'Renewing', Lease::STATUS_FUTURE => 'Future', Lease::STATUS_CURRENT => 'Current', Lease::STATUS_FORMER => 'Former', Lease::STATUS_CANCELLED => 'Cancelled'}

  MOVE_OUT_STEP_START = 'start'
  MOVE_OUT_STEP_RESIDENT_REQUESTED = 'resident_requested'
  MOVE_OUT_STEP_RENEW_ALL = 'renew_all'
  MOVE_OUT_STEP_MOVE_OUT_SOME = 'move_out_some'
  MOVE_OUT_STEP_COLLECT_ALL_ADDRESSES = 'collect_all_addresses'
  MOVE_OUT_STEP_MOVE_OUT_ALL = 'move_out_all'
  MOVE_OUT_STEP_PROCEED_TO_RENEW = 'proceed_to_renew'
  MOVE_OUT_STEP_COMPLETE = 'complete'
  MOVE_OUT_STEP_OPTIONS = {Lease::MOVE_OUT_STEP_START => 'Start', Lease::MOVE_OUT_STEP_RESIDENT_REQUESTED => 'Resident Requested', Lease::MOVE_OUT_STEP_RENEW_ALL => 'Renew All', Lease::MOVE_OUT_STEP_MOVE_OUT_SOME => 'Move-Out Some', Lease::MOVE_OUT_STEP_COLLECT_ALL_ADDRESSES => 'Collect All Addresses', Lease::MOVE_OUT_STEP_MOVE_OUT_ALL => 'Move-Out All', Lease::MOVE_OUT_STEP_PROCEED_TO_RENEW => 'Proceed to Renew', Lease::MOVE_OUT_STEP_COMPLETE => 'Complete'}

  SCREENING_PAYMENT_RESPONSIBILITY_ASK = 'ask'
  SCREENING_PAYMENT_RESPONSIBILITY_PROPERTY = 'property'
  SCREENING_PAYMENT_RESPONSIBILITY_RESIDENT = 'resident'

  ACTION_ADDING_LEAD = 'adding_lead'
  ACTION_ADDING_RESIDENT = 'adding_resident'
  ACTION_INVITE_TO_SCREENING = 'invite_to_screening'
  ACTION_BEGIN_APPLICATION = 'begin_application'
  ACTION_APPROVE_APPLICATION = 'approve'
  ACTION_DECLINE_APPLICATION = 'decline'
  ACTION_BEGIN_MOVE_IN = 'begin_move_in'
  ACTION_PROCESS_MOVE_IN = 'process_move_in'
  ACTION_PROCESS_RENEWAL = 'process_renewal'
  ACTION_CANCEL_RENEWAL = 'cancel_renewal'
  ACTION_CANCEL_MOVE_IN = 'cancel_move_in'
  ACTION_ADJUSTING_LEASE_END = 'adjusting_lease_end'
  ACTION_ADJUSTING_MOVE_OUT = 'adjusting_move_out'
  ACTION_BEGIN_MOVE_OUT = 'begin_move_out'
  ACTION_REQUESTING_MOVE_OUT = 'requesting_move_out'
  ACTION_CONTINUE_MOVE_OUT = 'continue_move_out'
  ACTION_CANCEL_MOVE_OUT = 'cancel_move_out'
  ACTION_PROCESS_MOVE_OUT = 'process_move_out'
  ACTION_ADD_EXISTING = 'add_exisitng'
  ACTION_OPTIONS = {Lease::ACTION_ADDING_LEAD => 'Add Lead', Lease::ACTION_INVITE_TO_SCREENING => 'Invite to Screening', Lease::ACTION_BEGIN_APPLICATION => 'Begin Application', Lease::ACTION_APPROVE_APPLICATION => 'Approve Application', Lease::ACTION_DECLINE_APPLICATION => 'Decline Application', Lease::ACTION_BEGIN_MOVE_IN => 'Begin Move-In', Lease::ACTION_PROCESS_MOVE_IN => 'Process Move-In', Lease::ACTION_CANCEL_MOVE_IN => 'Cancel Move-In', Lease::ACTION_ADJUSTING_LEASE_END => 'Adjusting Lease End', Lease::ACTION_ADJUSTING_MOVE_OUT => 'Adjusting Move-Out Date', Lease::ACTION_BEGIN_MOVE_OUT => 'Begin Move-Out', Lease::ACTION_REQUESTING_MOVE_OUT => 'Requesting Move-Out', Lease::ACTION_CONTINUE_MOVE_OUT => 'Continue Move-Out', Lease::ACTION_CANCEL_MOVE_OUT => 'Cancel Move-Out', Lease::ACTION_PROCESS_MOVE_OUT => 'Process Move-Out', Lease::ACTION_CANCEL_RENEWAL => 'Cancel Renewal', Lease::ACTION_PROCESS_RENEWAL => 'Process Renewal'}

  REFUND_MODE_ACH = 'ach'
  REFUND_MODE_PAPER_CHECK_HANDWRITTEN = 'paper_check_handwritten'
  REFUND_MODE_PAPER_CHECK_PRINTED = 'paper_check_printed'
  REFUND_MODE_OPTIONS = {Lease::REFUND_MODE_PAPER_CHECK_PRINTED => "Queue for Check Printing", Lease::REFUND_MODE_PAPER_CHECK_HANDWRITTEN => 'Handwritten Check'}

  TERM_MONTH_TO_MONTH = -1
  TERM_OPTIONS = {Lease::TERM_MONTH_TO_MONTH => 'Month-to-Month', 1 => '1 Month', 3 => '3 Months', 6 => '6 Months', 12 => '1 Year', 'other' => 'Other'}

  scope :current, -> { joins(:property).where(status: Lease::STATUS_CURRENT, property: {status: Property::STATUS_ACTIVE}) }
  scope :future, -> { joins(:property).where(status: Lease::STATUS_FUTURE, property: {status: Property::STATUS_ACTIVE}) }
  scope :current_or_future, -> { joins(:property).where(status: [Lease::STATUS_FUTURE, Lease::STATUS_CURRENT], property: {status: Property::STATUS_ACTIVE}) }
  scope :current_future_or_former, -> { joins(:property).where(status: [Lease::STATUS_FUTURE, Lease::STATUS_CURRENT, Lease::STATUS_FORMER], property: {status: Property::STATUS_ACTIVE}) }

  validates :property_id, presence: true, unless: :is_adding_lead?
  validates :unit_id, presence: true, unless: :is_before_move_in?
  validate :lease_dates_are_valid
  validate :lease_dates_do_not_overlap, if: :is_beginning_or_processing_move_in?
  validate :rent_and_deposit_set_for_approval, if: :is_approving_application?
  validates :rent, presence: true, numericality: {greater_than: 0}, if: :is_requesting_screening?
  validates :security_deposit, presence: true, numericality: {greater_than_or_equal_to: 0}, if: :is_requesting_screening?
  validates :lease_term, presence: true, if: :is_requesting_screening?
  validates :screening_payment_responsibility, presence: true, if: :is_requesting_screening?
  validates :screening_payment_method_id, presence: {message: 'A payment method must be selected'}, if: :is_requesting_screening_and_property_is_paying?
  validate :security_deposit_refund_data, if: :is_processing_move_out?

  validates :lease_start_on, presence: true, if: :is_adding_existing?
  validates :lease_end_on, presence: true, if: :is_adding_existing_and_is_not_month_to_month?
  validate :lease_dates_do_not_overlap, if: :is_adding_existing?
  validates :rent, presence: true, numericality: {greater_than: 0}, if: :is_adding_existing?
  validates :security_deposit, presence: true, numericality: {greater_than_or_equal_to: 0}, if: :is_adding_existing?

  def settings
    @s = Setting.for_property(self.company_id, self.property_id) if @s.nil?
    return @s
  end

  def is_adding_lead?
    lease_action == Lease::ACTION_ADDING_LEAD
  end

  def is_before_move_in?
    [nil, Lease::ACTION_ADDING_LEAD, Lease::ACTION_ADDING_RESIDENT, Lease::ACTION_INVITE_TO_SCREENING, Lease::ACTION_BEGIN_APPLICATION, Lease::ACTION_APPROVE_APPLICATION, Lease::ACTION_DECLINE_APPLICATION].include?(lease_action)
  end

  def is_inviting_to_screening?
    lease_action == Lease::ACTION_INVITE_TO_SCREENING
  end

  def is_beginning_application?
    lease_action == Lease::ACTION_BEGIN_APPLICATION
  end

  def is_adding_existing?
    lease_action == Lease::ACTION_ADD_EXISTING
  end

  def is_adding_existing_and_is_not_month_to_month?
    is_adding_existing? && !is_month_to_month?
  end

  def is_requesting_screening?
    settings.application_require_screening && (self.is_inviting_to_screening? || self.is_beginning_application?)
  end

  def is_approving_application?
    lease_action == Lease::ACTION_APPROVE_APPLICATION
  end

  def is_declining_application?
    lease_action == Lease::ACTION_DECLINE_APPLICATION
  end

  def is_beginning_move_in?
    lease_action == Lease::ACTION_BEGIN_MOVE_IN
  end

  def is_adjusting_lease_end?
    lease_action == Lease::ACTION_ADJUSTING_LEASE_END
  end

  def is_adjusting_move_out?
    lease_action == Lease::ACTION_ADJUSTING_MOVE_OUT
  end

  def is_beginning_move_out?
    lease_action == Lease::ACTION_BEGIN_MOVE_OUT
  end

  def is_continuing_move_out?
    lease_action == Lease::ACTION_CONTINUE_MOVE_OUT
  end

  def is_requesting_move_out?
    lease_action == Lease::ACTION_REQUESTING_MOVE_OUT
  end

  def is_cancelling_move_out?
    lease_action == Lease::ACTION_CANCEL_MOVE_OUT
  end

  def is_processing_move_out?
    lease_action == Lease::ACTION_PROCESS_MOVE_OUT
  end

  def is_processing_renewal?
    lease_action == Lease::ACTION_PROCESS_RENEWAL
  end

  def is_cancelling_renewal?
    lease_action == Lease::ACTION_CANCEL_RENEWAL
  end

  def is_processing_move_in?
    lease_action == Lease::ACTION_PROCESS_MOVE_IN
  end

  def is_beginning_or_processing_move_in?
    is_beginning_move_in? || is_processing_move_in?
  end

  def is_cancelling_move_in?
    lease_action == Lease::ACTION_CANCEL_MOVE_IN
  end

  def is_resident_responsible_for_payment?
    screening_payment_responsibility.nil? || screening_payment_responsibility == Lease::SCREENING_PAYMENT_RESPONSIBILITY_RESIDENT
  end

  def is_requesting_screening_and_property_is_paying?
    is_requesting_screening? && !is_resident_responsible_for_payment?
  end

  def is_current?
    status == Lease::STATUS_CURRENT
  end

  # is_current? tells us if the status is current. The method below will tell us
  # whether that is true and today's date is within the lease dates
  def is_current_and_active?
    if is_current?
      return PaymentService.todays_date <= self.move_out_on if self.move_out_on.present?
      return PaymentService.todays_date <= self.lease_end_on if self.lease_end_on.present? && !self.is_month_to_month?
      return true

    else
      return false
    end
  end

  def is_future?
    status == Lease::STATUS_FUTURE
  end

  def is_former?
    status == Lease::STATUS_FORMER
  end

  def is_approved?
    status == Lease::STATUS_APPROVED
  end

  def is_month_to_month?
    lease_term == Lease::TERM_MONTH_TO_MONTH
  end

  def lease_safe_end_on
    lease_end_on ||  (PaymentService.todays_date.end_of_month + 3.months)
  end

  def lease_dates_are_valid
    if lease_start_on && lease_end_on
      # Make sure the end date is after the start date
      if lease_end_on <= lease_start_on
        errors.add(:lease_end_on, "must be after the lease start date")
      end
    elsif lease_start_on && lease_end_on.nil? && !is_month_to_month?
      errors.add(:lease_end_on, "cannot be blank")
    elsif lease_start_on.nil? && lease_end_on
      errors.add(:lease_start_on, "cannot be blank")
    elsif move_in_on
      errors.add(:lease_start_on, "must be set on or before the move-in date") if lease_start_on.nil?
      errors.add(:lease_end_on, "must be after the lease start date") if lease_end_on.nil? && !is_month_to_month?
    end
  end

  def lease_dates_do_not_overlap
    if lease_start_on && lease_safe_end_on
      # Check to be sure this unit isn't already leased for this time period
      existing_leases = Lease.current_future_or_former.where(unit_id: self.unit_id).where(["(:lease_start_on BETWEEN lease_start_on AND IFNULL(move_out_on, lease_end_on)) or (:lease_end_on BETWEEN lease_start_on AND IFNULL(move_out_on, lease_end_on))", {lease_start_on: self.lease_start_on, lease_end_on: self.lease_safe_end_on}]).order(:lease_end_on)
      existing_leases = existing_leases.where("leases.id != #{self.id}") if self.id.present?

      if existing_leases.exists?
        errors.add(:lease_start_on, "must be after existing lease end (#{(existing_leases.last.move_out_on || existing_leases.last.lease_end_on).strftime('%m/%d/%Y')})")
        errors.add(:lease_end_on, "must be after existing lease end (#{(existing_leases.last.move_out_on || existing_leases.last.lease_end_on).strftime('%m/%d/%Y')})")
      end
    end
  end

  def rent_and_deposit_set_for_approval
    if !rent || !security_deposit
      errors.add(:base, "Rent and security deposit must be set before application is approved")
    end
  end

  def property_and_unit
    "#{property.name} - #{unit.unit_number}"
  end

  def evaluate_application_status
    # We will move the application along when certain criteria are met
    if self.is_approving_application?
      self.update({status: Lease::STATUS_APPROVED, lease_start_on: nil, lease_end_on: nil})

    elsif self.is_declining_application?
      self.update({status: Lease::STATUS_APPLICANT, lease_start_on: nil, lease_end_on: nil})

    elsif [Lease::APPLICATION_STATUS_NEW, Lease::APPLICATION_STATUS_IN_PROGRESS].include?(application_status)
      # Check to see if the primary and secondary residents have completed their applications
      all_are_submitted = true

      all_are_submitted &&= primary_resident.is_submitted? if primary_resident.present?
      secondary_residents.each{|secondary| all_are_submitted &&= secondary.is_submitted?}
      guarantors.each{|guarantor| all_are_submitted &&= guarantor.is_submitted?}

      self.update(application_status: all_are_submitted ? Lease::APPLICATION_STATUS_COMPLETED : Lease::APPLICATION_STATUS_IN_PROGRESS)
    end
  end

  def ledger_balance(as_of = nil)
    as_of = self.status == Lease::STATUS_FUTURE ? self.lease_start_on : LedgerItem.future_as_of() if as_of.nil?
    ResidentLedgerItem.as_of(as_of || PaymentService.todays_date()).where(lease_id: self.id).inject(0) do | sum, ledger_item|
      sum + ledger_item.amount
    end
  end

  def calculate_first_payment_as_of(months_forward = 1)
    self.status == Lease::STATUS_FUTURE ? self.lease_start_on : (PaymentService.todays_date() + months_forward.month)
  end

  def oldest_unpaid_charge_on(before = nil)
    charges = unpaid_charges(before)
    return charges.first&.transaction_at&.in_time_zone('US/Mountain')&.to_date
  end

  def last_payment_on()
    payments.succeeded_or_manual.order(:payment_at).last&.payment_at&.in_time_zone('US/Mountain')&.to_date
  end

  def unpaid_charges(before = nil)
    # Go through the ledger and find any unpaid charges... basically everything since the last time the balance was 0
    self.resident_ledger_items.reload
    unpaid = []
    balance = 0

    credits = self.resident_ledger_items.select{|ledger_item| ((ledger_item.related_object.is_a?(Charge) && ledger_item.related_object.charge_type_id != ChargeType::DEPOSIT && ledger_item.amount < 0)) && (before.nil? || ledger_item.transaction_at < before)}
    deposit_credits = self.resident_ledger_items.select{|ledger_item| ((ledger_item.related_object.is_a?(Charge) && ledger_item.related_object.charge_type_id == ChargeType::DEPOSIT && ledger_item.amount < 0)) && (before.nil? || ledger_item.transaction_at < before)}
    payments = self.resident_ledger_items.select{|ledger_item| (ledger_item.related_object.is_a?(Payment) || ledger_item.related_object.is_a?(PaymentReturn)) && (before.nil? || ledger_item.transaction_at < before)}

    total_credit_amount = [credits.inject(0) {| sum, ledger_item| sum + ledger_item.amount }, 0].min # Credits are negative
    total_deposit_credit_amount = [deposit_credits.inject(0) {| sum, ledger_item| sum + ledger_item.amount }, 0].min # Credits are negative
    total_payment_amount = [payments.inject(0) {| sum, ledger_item| sum + ledger_item.amount }, 0].min # Payments are negative

    self.resident_ledger_items.each do | ledger_item|

      if ledger_item.related_object.is_a?(Charge) && ledger_item.amount > 0 && (before.nil? || ledger_item.transaction_at < before)
        ledger_item.open_amount ||= ledger_item.amount

        if ledger_item.related_object.charge_type_id == ChargeType::DEPOSIT && total_deposit_credit_amount < 0
          amount_before_credit = ledger_item.open_amount
          ledger_item.open_amount = [[ledger_item.open_amount, ledger_item.open_amount + total_deposit_credit_amount].min, 0].max

          # Keep track of open amounts until all payments have been credited
          total_deposit_credit_amount += (amount_before_credit - ledger_item.open_amount)
        end

        # Can't be above the current amount or below 0
        # Apply payments first, then apply credits by type
        if total_payment_amount < 0 || total_credit_amount < 0
          if total_payment_amount < 0
            amount_before_credit = ledger_item.open_amount
            ledger_item.open_amount = [[ledger_item.open_amount, ledger_item.open_amount + total_payment_amount].min, 0].max

            # Keep track of open amounts until all payments have been credited
            total_payment_amount += (amount_before_credit - ledger_item.open_amount)

          end

          # If payments have been applied, now move on to apply credits
          if total_credit_amount < 0 && total_payment_amount >=0
            amount_before_credit = ledger_item.open_amount
            eligible_credit_amount = total_credit_amount#calculate_eligible_credit_amount(credits, ledger_item)

            ledger_item.open_amount = [[ledger_item.open_amount, ledger_item.open_amount + eligible_credit_amount].min, 0].max

            # Keep track of open amounts until all payments have been credited
            # Is this a credit? If so handle differently
            total_credit_amount += (amount_before_credit - ledger_item.open_amount)
          end
        end

        total_payment_amount = 0 if total_payment_amount > 0
        total_credit_amount = 0 if total_credit_amount > 0

        unpaid << ledger_item if ledger_item.open_amount > 0
      end

      balance += ledger_item.amount
      ledger_item.balance = balance
    end

    return unpaid
  end


  def calculate_eligible_credit_amount(credits, ledger_item)
    # Deposits can only have deposits credit applied
    if ledger_item.related_object.charge_type_id == ChargeType::DEPOSIT
      [credits.filter{|c| c.related_object.charge_type_id == ledger_item.related_object.charge_type_id}.inject(0) {| sum, ledger_item| sum + ledger_item.amount }, 0].min
    else
      [credits.inject(0) {| sum, ledger_item| sum + ledger_item.amount }, 0].min
    end

  end

  def monthly_charges_amount
    ResidentCharge.where(lease_id: self.id).order(:id).inject(0) do | sum, charge|
      if charge.is_monthly? && charge.charge_type_id != ChargeType::RENT
        sum + charge.amount
      else
        sum
      end
    end
  end

  def unposted_charges
    # Find all charges...  then remove any that have been put on the ledger already
    current_ledger_items = self.resident_ledger_items.to_a


    ResidentCharge.where(lease_id: self.id).order(:id).inject([]) do | acc, charge|
      if current_ledger_items.find{|li| li.related_object == charge }.nil?
        acc << charge
      else
        acc
      end
    end
  end

  def copy_for_renewal
    self.move_out_step = Lease::MOVE_OUT_STEP_PROCEED_TO_RENEW

    # Copy this lease... to a new one as the target for renewal
    if self.next_lease.nil?
      new_lease_attrs = self.attributes.slice("company_id", "property_id", "unit_id", "application_status", "move_in_checklist_items", "rent", "security_deposit", "security_deposit_paid", "lease_term")
      new_lease = Lease.new(new_lease_attrs)
      new_lease.status = Lease::STATUS_RENEWING

      # We need to handle MTM renewals carefully
      if self.is_month_to_month? && self.lease_end_on.nil?
        new_lease.lease_start_on = (PaymentService.todays_date + 1.month).beginning_of_month
      else
        new_lease.lease_start_on = self.lease_safe_end_on + 1.day
        new_lease.lease_end_on = new_lease.lease_start_on + (self.lease_safe_end_on - self.lease_start_on).days
      end

      new_lease.previous_lease_id = self.id

      self.lease_residents.reload

      # Copy all residents
      self.lease_residents.each do | existing_lease_resident |

        # All occupants and guarantors are automatically moved over
        if !(existing_lease_resident.is_a?(LeaseResidentPrimary) || existing_lease_resident.is_a?(LeaseResidentSecondary)) || existing_lease_resident.is_renewing_lease?
          new_lease_resident_attrs = existing_lease_resident.attributes.slice("resident_id", "type", "current_step", "external_screening_id", "external_screening_status", "screening_package_id", "application_fee_paid_at", "screening_fee_paid_at", "verification_attempt_count", "credit_score", "criminal_record_count", "eviction_count", "recurring_payment_frequency", "recurring_payment_starts_on", "recurring_payment_day_of_week", "recurring_payment_method_id", "screening_payment_method_id", "invitation_sent_at", "application_agreement_at", "application_agreement_ip_address", "identity_verification_failed_at", "screening_reopened_at", "application_completed_at")

          lease_resident = LeaseResident.new(new_lease_resident_attrs)
          lease_resident.lease = new_lease
          lease_resident.recurring_payment_next_payment_on = lease_resident.calculate_next_payment_on(lease_resident.recurring_payment_starts_on) if lease_resident.recurring_payment_starts_on.present?

          new_lease.lease_residents << lease_resident
        end
      end

      # Make sure we have a primary_resident
      if new_lease.lease_residents.find{|lr| lr.is_a?(LeaseResidentPrimary)}.nil?
        # Make the first secondary resident the primary
        first_secondary_resident = new_lease.lease_residents.find{|lr| lr.is_a?(LeaseResidentSecondary)}
        first_secondary_resident.type = LeaseResidentPrimary.to_s if first_secondary_resident.present?
      end

      new_lease.save

    end

    self.save(validate: false)
  end

  def proposed_charges_with_proration
    charges = ResidentCharge.where(lease_id: self.id).proposed.order(:id)

    # Calculate Proration and push onto ledger
    charges.each do |charge|
      charge.calculate_proration(self.settings, self.lease_safe_end_on.beginning_of_month, self.lease_safe_end_on)
    end

    return charges
  end

  def security_deposit_refund_data
    # Look into the future to see all of the charges that are going to be added
    # add those to the current balance and see if a credit is due
    charges = self.proposed_charges_with_proration()

    projected_ledger_balance = ledger_balance
    projected_ledger_balance += charges.inject(0) { | sum, charge| sum + charge.amount }

    if projected_ledger_balance < 0
      if self.security_deposit_refund_mode.blank?
        errors.add(:security_deposit_refund_mode, 'Select a refund method')
      elsif self.security_deposit_refund_mode == Lease::REFUND_MODE_ACH && self.security_deposit_refund_payment_method_id.blank?
        errors.add(:security_deposit_refund_payment_method_id, 'Select an ACH account')
      elsif self.security_deposit_refund_mode == Lease::REFUND_MODE_PAPER_CHECK_HANDWRITTEN && self.security_deposit_refund_check_number.blank?
        errors.add(:security_deposit_refund_check_number, 'Enter your check number')
      end
    end
  end

  def self.for_user(current_user)
    if current_user.is_resident?
      current_user.resident.leases
    else
      Lease.where(property: Property.for_user(current_user).active)
    end
  end

  def self.get_related_lease_ids(lease_id)
    return [] if lease_id.blank?
    
    sql = """
            WITH RECURSIVE lease_chain AS (
                -- Start with the known lease
                SELECT id, previous_lease_id
                FROM leases
                WHERE id = #{lease_id}

                UNION

                -- Go backwards in the chain
                SELECT l.id, l.previous_lease_id
                FROM leases l
                JOIN lease_chain lc ON l.id = lc.previous_lease_id AND l.deleted_at IS NULL

                UNION

                -- Go forwards in the chain
                SELECT l.id, l.previous_lease_id
                FROM leases l
                JOIN lease_chain lc ON l.previous_lease_id = lc.id AND l.deleted_at IS NULL
            )

            SELECT DISTINCT id
            FROM lease_chain
            """

    data = ActiveRecord::Base.connection.select_all(sql).to_a

    data.collect{|z| z["id"]}
  end

  def self.public_fields
    [
      :property_id, :unit_id, :rent, :security_deposit, :lease_term, :lease_start_on, :lease_end_on, :move_in_on, :move_out_on, :move_out_step, :notice_given_on,
      :status, :application_status, :screening_payment_responsibility, :screening_payment_method_id, :move_in_checklist_items, :move_out_checklist_items,
      :security_deposit_refund_mode, :security_deposit_refund_payment_method_id, :security_deposit_refund_check_number, :security_deposit_refund_amount
    ]
  end

  def self.private_fields
    [:id, :hash_id, :company_id, :previous_lease_id, :security_deposit_paid, :electronic_payments, :renters_insurance]
  end

  def self.move_out_document_builder(mod)
    Jbuilder.new do |json|
      json.id mod.id
      json.filename mod.filename.to_s
      json.content_type mod.content_type
      json.url Rails.application.routes.url_helpers.url_for(mod)
    end
  end

  def self.lease_document_builder(ld)
    Jbuilder.new do |json|
      json.id ld.id
      json.filename ld.filename.to_s
      json.content_type ld.content_type
      json.url Rails.application.routes.url_helpers.url_for(ld)
    end
  end

  def to_builder(level = "full")
    to_builder_with_user(nil, level)
  end

  def to_builder_with_user(current_user, level = "full")
    Jbuilder.new do |json|

      self.class.public_fields().each{| field | json.set!(field, self.send(field) || "")}
      self.class.private_fields().each{| field | json.set!(field, self.send(field) || "")}

      if level != "skinny"
        json.property_name self.property.name if self.property.present?
        json.unit_number_or_street self.unit.unit_number_or_street if self.unit.present?

        json.primary_resident (self.primary_resident ? self.primary_resident.to_builder_with_user(current_user, level).attributes! : nil)

        if ["full", "partial"].include?(level)
          json.unit self.unit.to_builder("partial").attributes! if self.unit.present?
          json.secondary_residents self.secondary_residents.collect{|po| po.to_builder_with_user(current_user, level).attributes!}
          json.minors self.minors.collect{|u| u.to_builder_with_user(current_user, level).attributes!}
          json.occupants self.occupants.collect{|u| u.to_builder_with_user(current_user, level).attributes!}
          json.guarantors self.guarantors.collect{|u| u.to_builder_with_user(current_user, level).attributes!}
        end

        if level == "full"
          json.ledger_balance self.ledger_balance()

          last_payment_at = self.payments.succeeded_or_manual.last&.payment_at
          json.last_payment_on last_payment_at.in_time_zone('US/Pacific').strftime('%Y-%m-%d') if last_payment_at.present?
          json.previous_lease_hash_id self.previous_lease&.hash_id
        end

        # Special condition... if we are mid-way through a renewal, provide the next_lease_hash_id
        if level == "full" || move_out_step == Lease::MOVE_OUT_STEP_PROCEED_TO_RENEW
          json.next_lease_hash_id self.next_lease&.hash_id
        end
      end
    end
  end

  private

  def touch_unit
    unit.update_status if unit.present?
  end

  def update_flags
    self.electronic_payments = lease_residents.find{|lr| lr.are_recurring_payments_active? }.present?
    self.renters_insurance = lease_residents.find{|lr| lr.is_renters_insurance_active? }.present?
  end
end

