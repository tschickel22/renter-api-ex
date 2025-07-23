class Api::PaymentsController < Api::ApiController

  def model_class
    ResidentPayment
  end

  def load_expense_payment
    render_json({ expense_payment: ExpensePayment.for_user(current_user).where(hash_id: params[:id]).first })
  end

  def pay_application_fee
    lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
    current_settings = Setting.for_lease_resident(lease_resident)
    resident_payment_method = ResidentPaymentMethod.where(id: params[:resident_payment_method_id]).first
    charge_type = ChargeType.where(name: "Fees").first

    # Create a charge... if one doesn't exist
    application_fee_amount = current_settings.application_charge_fee ? current_settings.application_fee : 0

    if application_fee_amount > 0
      charge_description = "Application Fee ##{lease_resident.hash_id}"

      if !ResidentCharge.where({ lease_id: lease_resident.lease_id, charge_type_id: charge_type.id, description: charge_description}).exists?
        charge = ResidentCharge.new_for_lease_resident(lease_resident)
        charge.charge_type = charge_type
        charge.description = charge_description
        charge.due_on = todays_date()
        charge.frequency = Charge::FREQUENCY_ONE_TIME
        charge.amount = application_fee_amount

        if charge.save
          AccountingService.push_to_ledger(charge)
        else
          render_json({errors: {base: charge.errors.full_messages.join(", ")}}, false)
          return
        end
      end

      # And then a payment for that Charge
      payment_result = PaymentService.process_one_time_payment(ResidentPayment, lease_resident, resident_payment_method, application_fee_amount, Setting::PAYMENT_FEE_TYPE_APPLICATION_FEE)

      if payment_result[:status] == Payment::STATUS_SUCCEEDED
        lease_resident.update({application_fee_paid_at: Time.now})
        mark_application_as_completed(lease_resident)
        render_json({payment: payment_result[:payment], lease_resident: lease_resident})

      elsif payment_result[:status] == Payment::STATUS_FAILED
        render_json({errors: {base: payment_result[:api_payment_error_message] || "Payment processor error. Please try again."}}, false)
      else
        render_json({errors: extract_errors_by_attribute(payment_result[:payment])}, false)
      end
    else
      mark_application_as_completed(lease_resident)
      render_json({lease_resident: lease_resident})
    end
  end

  def pay_screening_fee
    lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
    current_settings = Setting.for_lease_resident(lease_resident)
    resident_payment_method = ResidentPaymentMethod.where(id: params[:resident_payment_method_id]).first

    if current_settings.application_require_screening

      screening_fee_amount = lease_resident.screening_package.price
      charge_description = "Screening Fee ##{lease_resident.hash_id}"

      if lease_resident.lease.screening_payment_responsibility == "resident"

        # And then a payment for that Charge
        payment_result = PaymentService.process_one_time_payment(ResidentPayment, lease_resident, resident_payment_method, screening_fee_amount, Setting::PAYMENT_FEE_TYPE_SCREENING_FEE)

        if payment_result[:status] == Payment::STATUS_SUCCEEDED
          lease_resident.update({screening_fee_paid_at: Time.now})

          render_json({payment: payment_result[:payment], lease_resident: lease_resident})

        elsif payment_result[:status] == Payment::STATUS_FAILED
          render_json({errors: {base: payment_result[:api_payment_error_message] || "Payment processor error. Please try again."}}, false)
        else
          render_json({errors: extract_errors_by_attribute(payment_result[:payment])}, false)
        end
      else

        payment_result = ChargeCompanyForScreening.perform(lease_resident.id)

        if payment_result[:status] == Payment::STATUS_SUCCEEDED
          lease_resident.update({screening_fee_paid_at: Time.now})

          render_json({payment: payment_result[:payment], lease_resident: lease_resident})

        elsif payment_result[:status] == Payment::STATUS_FAILED
          render_json({errors: {base: payment_result[:api_payment_error_message] || "Payment processor error. Please try again."}}, false)
        else
          render_json({errors: extract_errors_by_attribute(payment_result[:payment])}, false)
        end
      end
    else
      render_json({}, true)
    end
  end

  def application_fee
    lease_resident = LeaseResident.for_user(current_user).where(hash_id: params[:lease_resident_id]).first
    payment = ResidentPayment.succeeded.where(lease_id: lease_resident.lease_id, resident_id: lease_resident.resident_id).first if lease_resident.present?
    render_json({payment: payment.present? ? payment.to_builder("full").attributes! : nil})
  end

  def make_one_time_payment
    Rails.logger.error("One-time payment")

    one_time_payment_params = parse_number_param(params.permit(:amount), [:amount])

    lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
    resident_payment_method = ResidentPaymentMethod.find(params[:resident_payment_method_id])

    if resident_payment_method.is_cash?
      render_json({errors: {base: "Payment processor error. Please click Bill Pay link above."}}, false)
    else
      if !current_user.is_resident? || lease_resident.lease.settings.allow_partial_payments || [Lease::STATUS_FUTURE, Lease::STATUS_FORMER].include?(lease_resident.lease.status)
        payment_amount = one_time_payment_params[:amount]
      else
        payment_amount = lease_resident.lease.ledger_balance
      end

      payment_result = PaymentService.process_one_time_payment(ResidentPayment, lease_resident, resident_payment_method, payment_amount, Setting::PAYMENT_FEE_TYPE_ONE_TIME_CHARGES)

      if payment_result[:status] == Payment::STATUS_SUCCEEDED
        render_json({payment: payment_result[:payment]})

      elsif payment_result[:status] == Payment::STATUS_FAILED
        render_json({errors: {base: payment_result[:api_payment_error_message] || "Payment processor error. Please try again."}}, false)
      else
        render_json({errors: extract_errors_by_attribute(payment_result[:payment])}, false)
      end
    end
  end

  def sign_up_for_recurring_payments

    Rails.logger.error("Sign Up for recurring payments")
    lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first

    # Temporary, for calculation purposes
    lease_resident.recurring_payment_starts_on = lease_resident.lease.calculate_first_payment_as_of
    lease_resident.recurring_payment_frequency = params[:recurring_payment_frequency]

    if lease_resident.are_recurring_payments_active?

      # Weekly
      if lease_resident.are_weekly_recurring_payments_active?
        lease_resident.recurring_payment_day_of_week = params[:recurring_payment_day_of_week] || PaymentService.todays_date().wday

      # Monthly
      else
        lease_resident.recurring_payment_day_of_week = nil
      end

      payment_date_schedule = lease_resident.payment_dates(4)
      next_payment = payment_date_schedule.find{|payment_date| payment_date[:date] > PaymentService.todays_date()}

      # If there is no next payment, just set it to the 1st of the next month
      if next_payment.present?
        lease_resident.recurring_payment_starts_on = next_payment[:date]
      else
        lease_resident.recurring_payment_starts_on = PaymentService.todays_date().end_of_month + 1.day
      end

      # We need to handle the one-time payment
      if !payment_date_schedule.empty? && payment_date_schedule.first[:date] == PaymentService.todays_date() && payment_date_schedule.first[:amount] > 0
        payment_amount = payment_date_schedule.first[:amount]
        payment_result = PaymentService.process_one_time_payment(ResidentPayment, lease_resident, ResidentPaymentMethod.find(params[:resident_payment_method_id]), payment_amount, Setting::PAYMENT_FEE_TYPE_ONE_TIME_CHARGES)

        if payment_result[:status] == Payment::STATUS_SUCCEEDED
          # Nothing to do... continue on

        elsif payment_result[:status] == Payment::STATUS_FAILED
          render_json({errors: {base: payment_result[:api_payment_error_message] || "Payment processor error. Please try again."}}, false)
          return
        else
          render_json({errors: extract_errors_by_attribute(payment_result[:payment])}, false)
          return
        end
      end

      lease_resident.recurring_payment_method_id = params[:resident_payment_method_id]
      lease_resident.recurring_payment_day_of_week = lease_resident.recurring_payment_starts_on.wday
      lease_resident.recurring_payment_next_payment_on = lease_resident.calculate_next_payment_on(lease_resident.recurring_payment_starts_on)
    else
      lease_resident.recurring_payment_starts_on = nil
      lease_resident.recurring_payment_method_id = nil
      lease_resident.recurring_payment_day_of_week = nil
      lease_resident.recurring_payment_next_payment_on = nil
    end

    if lease_resident.save
      render_json({ lease_resident: lease_resident }, true)
    else
      render_json({errors: extract_errors_by_attribute(lease_resident)}, false)
    end
  end

  def payment_schedule
    lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
    lease_resident.assign_attributes(params.permit(:recurring_payment_frequency))
    lease_resident.recurring_payment_starts_on = lease_resident.lease.calculate_first_payment_as_of

    # Weekly
    if lease_resident.are_weekly_recurring_payments_active?
      lease_resident.recurring_payment_day_of_week = params[:recurring_payment_day_of_week] || lease_resident.recurring_payment_starts_on.wday

    # Monthly
    else
      lease_resident.recurring_payment_day_of_week = lease_resident.recurring_payment_starts_on.wday
    end

    render_json({payment_dates: lease_resident.payment_dates(100)})
  end

  def create_multiple
    payments = []
    all_valid = true

    params[:payments].each do | pp |
      payment_params = parse_number_param(pp.permit(ResidentPayment.public_fields), [:amount])

      payment = ResidentPayment.new(payment_params)

      if !pp[:amount].blank?
        # Find the lease
        lease = Lease.where(hash_id: pp[:lease_hash_id]).first

        payment.company_id = lease.company_id
        payment.property_id = lease.property_id
        payment.lease_id = lease.id
        payment.status = Payment::STATUS_MANUAL

        if !params[:manual_payment_on].blank?
          payment.payment_at = DateTime.parse(params[:manual_payment_on])

        else
          payment.payment_at = Time.now
        end

        params[:manual_payment_on].present?

        all_valid &&= payment.valid?
      end

      payments << payment

    end

    if all_valid
      payments.each do | payment |
        if payment.save
          AccountingService.push_to_ledger(payment, amount_for_ledger: payment.amount)

          # Is this payment backdated? If so, clear any late fees if it's within the grace period
          if payment.payment_at.in_time_zone('US/Mountain').to_date < todays_date()

            # Was this payment within the grace period?
            if payment.payment_at.in_time_zone('US/Mountain').to_date <= Date.new(Date.today.year, Date.today.month, (payment.lease.settings.grace_period || 5))
              late_fee = ResidentCharge.where(lease_id: payment.lease_id, charge_type_id: ChargeType::LATE_FEE).where("due_on BETWEEN :start_date AND :end_date", {start_date: todays_date.beginning_of_month, end_date: todays_date.end_of_month}).first

              if late_fee.present?
                late_fee.force_destroy
              end
            end
          end
        end
      end

      render_json({ plural_object_key() => payments })

    else
      render_json({errors: {payments: extract_errors_by_attribute(payments)}}, false)
    end
  end

  def refund
    payment = ResidentPayment.for_user(current_user).where(hash_id: params[:id]).first if !current_user.is_resident?

    result = PaymentService.refund_payment(payment, current_user, request)

    render_json(result, result.delete(:success))
  end

  def destroy
    @object = ResidentPayment.for_user(current_user).where(hash_id: params[:id]).first
    lease_id = @object.lease_id

    if @object.present? && @object.is_manual? && @object.force_destroy

      AccountingService.update_security_deposit_paid(Lease.find(lease_id)) if lease_id.present?

      render_successful_update()
    else
      render_failed_update()
    end
  end


  protected

  def mark_application_as_completed(lease_resident)
    # Is this for an application? If so, mark that application as submitted
    lease_resident.mark_application_submitted()
    lease_resident.evaluate_current_step

    lease = lease_resident.lease

    lease.evaluate_application_status()

    # Send un-sent invitations
    if lease_resident.is_a?(LeaseResidentPrimary)
      lease.secondary_residents.where(invitation_sent_at: nil).each do | secondary_resident |
        if ResidentMailer.invitation(secondary_resident.id).deliver
          secondary_resident.screening_package_id ||= lease_resident.screening_package_id
          secondary_resident.invitation_sent_at = Time.now
          secondary_resident.save(validate: false)
        end
      end

      lease.guarantors.where(invitation_sent_at: nil).each do | guarantor |
        if ResidentMailer.invitation(guarantor.id).deliver
          guarantor.screening_package_id ||= lease_resident.screening_package_id
          guarantor.invitation_sent_at = Time.now
          guarantor.save(validate: false)
        end
      end
    end
  end
end