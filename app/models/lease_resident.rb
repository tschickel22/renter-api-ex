class LeaseResident < ParanoidRecord
  include ActionView::Helpers::NumberHelper

  has_paper_trail versions: {class_name: "Versions::Lease"}
  before_create :generate_hash
  belongs_to :lease
  belongs_to :resident
  belongs_to :screening_package
  belongs_to :recurring_payment_method, class_name: 'ResidentPaymentMethod'

  has_one :screening_request
  has_many :lease_resident_reports
  has_one :lead_info
  has_one :insurance

  accepts_nested_attributes_for :resident
  accepts_nested_attributes_for :lead_info

  STEP_LEAD = 'lead'
  STEP_INVITATION = 'invitation'
  STEP_OCCUPANT_DETAILS = 'occupant_details'
  STEP_APPLICANT_DETAILS = 'applicant_details'
  STEP_SCREENING = 'screening'
  STEP_SCREENING_IDENTITY_PENDING = 'screening_identity_pending'
  STEP_SCREENING_READY_FOR_REPORTS = 'screening_ready_for_reports'
  STEP_SCREENING_IN_PROGRESS = 'screening_in_progress'
  STEP_SCREENING_COMPLETE = 'screening_complete'
  STEP_SCREENING_ERROR = 'screening_error'
  STEP_PAYMENT = 'payment'
  STEP_AGREEMENT = 'agreement'
  STEP_PAYMENT_SUCCESSFUL = 'payment-successful'
  STEP_SUBMITTED = 'submitted'

  STEP_OPTIONS = {
    LeaseResident::STEP_LEAD => "Lead",
    LeaseResident::STEP_INVITATION => "Invited",
    LeaseResident::STEP_OCCUPANT_DETAILS => "Occupant Details",
    LeaseResident::STEP_APPLICANT_DETAILS => "Applicant Details",
    LeaseResident::STEP_AGREEMENT => "Agreement",
    LeaseResident::STEP_SCREENING => "Start of Screening",
    LeaseResident::STEP_SCREENING_IDENTITY_PENDING => "Identity Verification",
    LeaseResident::STEP_SCREENING_READY_FOR_REPORTS => "Identity Verified",
    LeaseResident::STEP_PAYMENT => "Payment",
    LeaseResident::STEP_SCREENING_IN_PROGRESS => "Processing Screening",
    LeaseResident::STEP_SCREENING_COMPLETE => "Screening Complete",
    LeaseResident::STEP_SCREENING_ERROR => "Screening Error",
    LeaseResident::STEP_SUBMITTED => "Submitted"
  }

  TYPE_OPTIONS = {
    'LeaseResidentPrimary' => "Primary",
    'LeaseResidentSecondary' => "Secondary",
    'LeaseResidentMinor' => "Minor",
    'LeaseResidentOccupant' => "Occupant",
    'LeaseResidentGuarantor' => "Guarantor"
  }

  CREDIT_SCORE_LIMIT_ACCEPT = 560
  CREDIT_SCORE_LIMIT_LOW_ACCEPT = 538
  CREDIT_SCORE_LIMIT_CONDITIONAL = 524

  CREDIT_LEVEL_ACCEPT = 'accept'
  CREDIT_LEVEL_LOW_ACCEPT = 'low-accept'
  CREDIT_LEVEL_CONDITIONAL = 'conditional'
  CREDIT_LEVEL_DECLINE = 'decline'
  CREDIT_LEVEL_NO_RECORD = 'no-record'

  CREDIT_LEVEL_OPTIONS = {LeaseResident::CREDIT_LEVEL_ACCEPT => 'Accept', LeaseResident::CREDIT_LEVEL_LOW_ACCEPT => 'Low Accept', LeaseResident::CREDIT_LEVEL_CONDITIONAL => 'Conditional', LeaseResident::CREDIT_LEVEL_DECLINE => 'Decline', LeaseResident::CREDIT_LEVEL_NO_RECORD => 'Score not available'}

  RECURRING_PAYMENT_FREQUENCY_NONE = 'none'
  RECURRING_PAYMENT_FREQUENCY_WEEKLY = 'weekly'
  RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY = 'biweekly'
  RECURRING_PAYMENT_FREQUENCY_MONTHLY = 'monthly'

  RECURRING_PAYMENT_FREQUENCY_OPTIONS = {LeaseResident::RECURRING_PAYMENT_FREQUENCY_NONE => 'None', LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY => 'Weekly', LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY => 'Bi-weekly', LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY => 'Monthly'}

  MOVE_OUT_INTENTION_RENEW = 'renew'
  MOVE_OUT_INTENTION_MOVE_OUT = 'move_out'

  MOVE_OUT_INTENTION_OPTIONS = {LeaseResident::MOVE_OUT_INTENTION_RENEW => 'Renew', LeaseResident::MOVE_OUT_INTENTION_MOVE_OUT => 'Move-Out'}

  validates :recurring_payment_method_id, presence: true, if: :are_recurring_payments_active?
  validates :recurring_payment_starts_on, presence: true, if: :are_recurring_payments_active?
  validates :recurring_payment_day_of_week, presence: true, if: :are_weekly_recurring_payments_active?
  validate :move_out_information

  def name
    resident&.name
  end

  def are_recurring_payments_active?
    [LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY].include?(recurring_payment_frequency)
  end

  def is_renters_insurance_active?
    insurance.present? && insurance.is_active?
  end

  def are_weekly_recurring_payments_active?
    [LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY, LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY].include?(recurring_payment_frequency)
  end

  def evaluate_current_step
    current_settings = Setting.for_property(lease.company_id, lease.property_id)
    skip_further_updates = false

    # If we are in the middle of the screening process, let's navigate that flow
    if !self.external_screening_status.blank?
      new_current_step = nil
      if self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_IDENTITY_VERIFICATION_PENDING
        new_current_step = LeaseResident::STEP_SCREENING_IDENTITY_PENDING
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_SCREENING_REQUEST_CANCELED
        new_current_step = LeaseResident::STEP_SCREENING_ERROR
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_READY_FOR_REPORT_REQUEST
        # Check to see if the fee has already been paid
        go_to_payment = self.lease.is_resident_responsible_for_payment? && self.screening_fee_paid_at.nil?
        go_to_payment ||= (current_settings.application_charge_fee && current_settings.application_fee > 0) && self.application_fee_paid_at.nil?

        if go_to_payment
          new_current_step = LeaseResident::STEP_PAYMENT
        else
          new_current_step = LeaseResident::STEP_SCREENING_READY_FOR_REPORTS
        end

      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_PAYMENT_FAILURE
        new_current_step = LeaseResident::STEP_SCREENING_ERROR
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_IN_PROGRESS
        new_current_step = LeaseResident::STEP_SCREENING_IN_PROGRESS
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_FAILED
        new_current_step = LeaseResident::STEP_SCREENING_ERROR
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_SUCCESS
        new_current_step = LeaseResident::STEP_SCREENING_COMPLETE

        if application_completed_at.nil?
          self.application_completed_at = Time.now
          self.current_step = new_current_step
          self.save(validate: false)

          CompanyMailer.send_to_appropriate_users(:screening_complete, lease.property, self.id)

          skip_further_updates = true
        end

      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_RETRY_LIMIT_EXCEEDED
        new_current_step = LeaseResident::STEP_SCREENING_ERROR
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_SCREENING_REQUEST_EXPIRED
        new_current_step = LeaseResident::STEP_SCREENING_ERROR
      elsif self.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_SCREENING_SKIPPED
        new_current_step = LeaseResident::STEP_SUBMITTED

        if application_completed_at.nil?
          self.application_completed_at = Time.now
          self.current_step = new_current_step
          self.save(validate: false)

          CompanyMailer.send_to_appropriate_users(:screening_skipped, lease.property, self.id)

          skip_further_updates = true
        end
      end

      if !skip_further_updates && !new_current_step.blank?
        self.update_attribute(:current_step, new_current_step)
        skip_further_updates = true
      end
    end

    if !skip_further_updates
      if self.current_step == LeaseResident::STEP_SCREENING && !self.external_screening_id.blank?
        self.update_attribute(:current_step, LeaseResident::STEP_SCREENING_IDENTITY_PENDING)
      elsif self.current_step.nil? || self.current_step == LeaseResident::STEP_OCCUPANT_DETAILS
        self.update_attribute(:current_step, LeaseResident::STEP_APPLICANT_DETAILS)

      elsif self.current_step == LeaseResident::STEP_APPLICANT_DETAILS

        # Check for screening package limitations
        self.check_screening_package_limitations()

        self.update_attribute(:current_step, LeaseResident::STEP_AGREEMENT)

      elsif self.current_step == LeaseResident::STEP_AGREEMENT

        if self.application_agreement_at.present?
          if self.lease.property.screening_is_activated?
            self.update_attribute(:current_step, LeaseResident::STEP_SCREENING)
          else
            # Is the property paying or the resident?
            if current_settings.application_charge_fee && current_settings.application_fee > 0

              # Check to see if the fee has already been paid
              if self.application_fee_paid_at.nil?
                self.update_attribute(:current_step, LeaseResident::STEP_PAYMENT)
              else
                self.mark_application_submitted()
              end
            else
              self.mark_application_submitted()
            end
          end
        end

        # THIS CANT BE RIGHT
      elsif self.current_step == LeaseResident::STEP_PAYMENT_SUCCESSFUL
        self.update_attribute(:current_step, LeaseResident::STEP_SUBMITTED)
      end
    end

    self.lease.evaluate_application_status()
  end

  def mark_application_submitted
    self.update_attribute(:current_step, LeaseResident::STEP_SUBMITTED)

    # Let the landlord know the application is complete
    if !self.lease.property.screening_is_activated? && self.application_completed_at.nil?
     self.update_attribute(:application_completed_at, Time.now)
     CompanyMailer.send_to_appropriate_users(:application_complete, self.lease.property, self.id)
    end
  end

  def check_screening_package_limitations
    # Look at the selected screening package. If it has any exclusions, make sure we move to a screening package without them
    if self.screening_package.present? && !self.screening_package.state_exclusion_list.empty?
      resident_state = resident.resident_residence_histories.first&.state

      if self.screening_package.state_exclusion_list.include?(resident_state)
        # Step through the screening packages, find one that works
        new_screening_package_id = ScreeningPackage.order(:price).inject(nil) do | package_id, sp |
          if package_id.nil? &&  !sp.state_exclusion_list.include?(resident_state)
            package_id = sp.id
          end

          package_id
        end

        Rails.logger.error("SCREENING PACKAGE SWITCH: #{self.id} to #{new_screening_package_id}")
        self.update_attribute(:screening_package_id, new_screening_package_id)
      end
    end
  end

  def self.for_user(current_user)
    if current_user.nil?
      LeaseResident.joins(:resident).where("residents.user_id IS NULL or current_step = '#{LeaseResident::STEP_INVITATION}'")
    elsif current_user.is_resident?
      LeaseResident.joins({lease: :property}).where(resident_id: current_user.resident.id).where(property: {status: Property::STATUS_ACTIVE})
    elsif current_user.is_company_admin?
      LeaseResident.joins(:lease).where(lease: {company_id: current_user.company_id})
    else
      LeaseResident.joins({lease: :property}).where(lease: {property: Property.for_user(current_user).active})
    end
  end

  def credit_level
    if credit_score.present?
      if credit_score >= LeaseResident::CREDIT_SCORE_LIMIT_ACCEPT
        return LeaseResident::CREDIT_LEVEL_ACCEPT
      elsif credit_score >= LeaseResident::CREDIT_SCORE_LIMIT_LOW_ACCEPT
        return LeaseResident::CREDIT_LEVEL_LOW_ACCEPT
      elsif credit_score >= LeaseResident::CREDIT_SCORE_LIMIT_CONDITIONAL
        return LeaseResident::CREDIT_LEVEL_CONDITIONAL
      else
        return LeaseResident::CREDIT_LEVEL_DECLINE
      end
    else
      return LeaseResident::CREDIT_LEVEL_NO_RECORD
    end
  end

  def payment_dates(iterations = 4)

    payment_date_array = []

    if !recurring_payment_day_of_week.blank? || recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY

      current_date = calculate_beginning_of_recurring_payment_schedule
      payment_date_schedule = generate_payment_dates(current_date, iterations)

      catch_up_payment = generate_catch_up_payment(payment_date_schedule)
      payment_date_array << catch_up_payment if catch_up_payment.present?

      # Drop any payments that we have missed
      payment_date_schedule = payment_date_schedule.select { | payment_date| payment_date[:date] > PaymentService.todays_date() }
      payment_date_array += payment_date_schedule

    end

    return payment_date_array
  end

  def generate_catch_up_payment(payment_date_schedule)
    amount = calculate_catch_up_payment_amount(payment_date_schedule)

    if amount > 0
      {date: PaymentService.todays_date(), amount_pct: 100, amount: amount, amount_description: number_to_currency(amount), day_description: "One-time"}
    else
      nil
    end
  end

  def calculate_catch_up_payment_amount(payment_date_schedule)
    if self.lease.present?
      # Weekly and Bi-Weekly must figure out how much to pay in order to "catch-up"
      if self.are_weekly_recurring_payments_active?
        as_of = self.lease.calculate_first_payment_as_of
      else
        as_of = nil
      end

      todays_balance = self.lease.ledger_balance(PaymentService.todays_date())
      future_ledger_balance = self.lease.ledger_balance(as_of)

      if recurring_payment_starts_on.present? && recurring_payment_starts_on >= PaymentService.todays_date() && future_ledger_balance && future_ledger_balance > 0

        if self.are_weekly_recurring_payments_active?
          catch_up_amount = future_ledger_balance - todays_balance

          # Figure out where we are in the cycle. Start at the first of the current month and see how many payments we have missed
          missed_payments = payment_date_schedule.select{|payment_date| payment_date[:date] <= PaymentService.todays_date()}

          if self.recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY
            pct_missed = missed_payments.count / 2.0
            return todays_balance + (catch_up_amount * pct_missed)
          else # LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY
            pct_missed = missed_payments.count / 4.0
            return todays_balance + (catch_up_amount * pct_missed)
          end

        else
          return todays_balance
        end
      end
    end

    return 0
  end

  def calculate_beginning_of_recurring_payment_schedule
    if self.are_weekly_recurring_payments_active?
      # Are we starting today or have we already started?
      if recurring_payment_starts_on.nil? || recurring_payment_starts_on >= PaymentService.todays_date()
        current_date = self.lease.calculate_first_payment_as_of(0)
      else
        current_date = PaymentService.todays_date()
      end

      current_date = current_date.beginning_of_month

      # Figure out next day of the week that occurs
      if recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY || current_date != PaymentService.todays_date()
        if current_date.wday > recurring_payment_day_of_week
          current_date = current_date + (7 - (current_date.wday - recurring_payment_day_of_week)).days
        else
          current_date = current_date + (recurring_payment_day_of_week - current_date.wday).days
        end
      elsif recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY
        current_date = current_date + (14 - (current_date - recurring_payment_starts_on).remainder(14)).days
      end

    else
      current_date = recurring_payment_starts_on.beginning_of_month
      current_date = current_date + 1.month if recurring_payment_starts_on < PaymentService.todays_date()
    end

    return current_date
  end

  def generate_payment_dates(current_date, iterations)
    payment_date_array = []

    amount = 100
    amount = 50 if recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY
    amount = 25 if recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY

    (1..iterations).each do | _i |

      if current_date <= self.lease.lease_safe_end_on
        # Only so many payments in one month...
        payments_this_month = payment_date_array.select{|pd| pd[:date].beginning_of_month == current_date.beginning_of_month}

        if (payments_this_month.length < 4 && recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY) || (payments_this_month.length < 2 && recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY) || (payments_this_month.length < 1 && recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY)
          payment_date_array << {date: current_date, amount_pct: amount, amount_description: "#{amount}% of Balance", day_description: current_date.strftime('%A')}

          if recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY
            current_date = current_date + 1.week
          elsif recurring_payment_frequency == LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY
            current_date = current_date + 2.week
          else
            current_date = current_date + 1.month
          end
        else
          # Let's just get to the next month... one week at a time
          current_date = current_date + 1.week
        end
      end
    end

    return payment_date_array
  end

  def calculate_next_payment_on(starting_on = nil)
    starting_on ||= PaymentService.todays_date()

    next_payment_date = nil
    payment_dates(100).each do | payment_date |
      next_payment_date ||= payment_date if payment_date[:date] >= starting_on
    end

    return next_payment_date[:date] if next_payment_date.present?
  end

  def is_submitted?
    [LeaseResident::STEP_SUBMITTED, LeaseResident::STEP_SCREENING_COMPLETE].include?(current_step)
  end

  def is_renewing_lease?
    move_out_intention == LeaseResident::MOVE_OUT_INTENTION_RENEW
  end

  def invitation_sent_at_pretty
    invitation_sent_at.strftime("%m/%d/%Y") if invitation_sent_at.present?
  end

  def application_completed_at_pretty
    application_completed_at.strftime("%m/%d/%Y") if application_completed_at.present?
  end

  def move_out_information
    current_settings = Setting.for_property(lease.company_id, lease.property_id)

    if lease.lease_action == Lease::ACTION_CONTINUE_MOVE_OUT
      if move_out_intention.blank? && lease.move_out_step == Lease::MOVE_OUT_STEP_MOVE_OUT_SOME
        errors.add(:move_out_intention, 'select one')
      elsif current_settings.forwarding_addresses_required && (move_out_intention == LeaseResident::MOVE_OUT_INTENTION_MOVE_OUT || lease.move_out_step == Lease::MOVE_OUT_STEP_COLLECT_ALL_ADDRESSES)
        errors.add(:forwarding_street, 'cannot be blank') if forwarding_street.blank?
        errors.add(:forwarding_city, 'cannot be blank') if forwarding_city.blank?
        errors.add(:forwarding_state, 'cannot be blank') if forwarding_state.blank?
        errors.add(:forwarding_zip, 'cannot be blank') if forwarding_zip.blank?
      end
    end
  end

  def self.public_fields
    [
      :id, :lease_id, :type, :current_step, :screening_package_id, :invitation_sent_at, :verification_attempt_count,
      :credit_score, :criminal_record_count, :eviction_count, :screening_payment_method_id,
      :move_out_intention, :forwarding_street, :forwarding_city, :forwarding_state, :forwarding_zip
    ]
  end

  def self.private_fields
    [:hash_id, :external_screening_id, :external_screening_status, :credit_level, :recurring_payment_frequency, :recurring_payment_day_of_week, :recurring_payment_starts_on, :recurring_payment_method_id, :application_agreement_at, :screening_reopened_at, :application_completed_at]
  end

  def to_builder(level = "full")
    to_builder_with_user(nil, level)
  end

  def to_builder_with_user(current_user, level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.resident (self.resident ? self.resident.to_builder(level).attributes! : nil)
      json.updated_at self.updated_at

      if level == "inverse" || level == "full"
        json.lease_resident_reports (self.lease_resident_reports.filter{|sr| sr.audience == LeaseResidentReport.audience_for_user(current_user)}.collect{|lrr| lrr.to_builder("partial").attributes!})
        json.lead_info self.lead_info.to_builder.attributes! if self.lead_info.present?
      end

      if level == "inverse"
        json.lease self.lease.to_builder("partial").attributes! if self.lease.present?
        json.screening_package self.screening_package&.to_builder().attributes! if self.screening_package.present?
      elsif level == "inverse_skinny"
        json.lease self.lease.to_builder("skinny").attributes! if self.lease.present?
      end
    end
  end
end