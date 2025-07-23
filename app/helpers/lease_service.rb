class LeaseService
  def self.handle_before_create_save(lease, current_user)
    if current_user.nil?
      # Is this person just messaging the property (a lead) or beginning an application (an applicant)
      if lease.is_beginning_application?
        # Look up the unit listing and set the proper values on the lease
        unit_listing = lease.primary_resident.lead_info.unit_listing

        lease.unit_id = unit_listing.unit_id if !unit_listing.is_floor_plan_listing?
        lease.rent = unit_listing.rent
        lease.security_deposit = unit_listing.security_deposit
        lease.lease_term = unit_listing.lease_term

      end

      if lease.is_beginning_application? || lease.is_adding_lead?
        if lease.settings.application_require_screening
          # Set up the screening payment requirements
          if lease.settings.screening_who_pays == Lease::SCREENING_PAYMENT_RESPONSIBILITY_ASK || lease.settings.screening_who_pays == Lease::SCREENING_PAYMENT_RESPONSIBILITY_PROPERTY
            lease.screening_payment_responsibility = Lease::SCREENING_PAYMENT_RESPONSIBILITY_PROPERTY
            lease.screening_payment_method_id ||= lease.settings.default_screening_payment_method_id
            lease.screening_payment_method_id ||= unit_listing.company.payment_methods.first&.id if unit_listing.present?
          else
            lease.screening_payment_responsibility = Lease::SCREENING_PAYMENT_RESPONSIBILITY_RESIDENT
          end

          # Set the proper screening package
          lease.primary_resident.screening_package_id = lease.settings.default_screening_package_id || ScreeningPackage::DEFAULT_PACKAGE_ID
        end
      end
    end
  end

  def self.handle_after_create_or_update(lease, current_user, request_params = {})
    if lease.primary_resident.present? && lease.is_inviting_to_screening?
      lease.update(status: Lease::STATUS_APPLICANT, application_status: Lease::APPLICATION_STATUS_NEW)

      ResidentMailer.deliver_invitation_and_mark_as_sent(lease.primary_resident)

      # Invite co-residents
      lease.secondary_residents.each do | secondary_resident |
        ResidentMailer.deliver_invitation_and_mark_as_sent(secondary_resident)
      end

    elsif lease.primary_resident.present? && lease.is_beginning_application?
      # Is this coming from a listing? If so, shoot off an invitation email
      if current_user.nil? && lease.primary_resident&.lead_info&.unit_listing.present?
        ResidentMailer.application_begin_confirmation(lease.primary_resident.id).deliver
      else
        lease.update(status: Lease::STATUS_APPLICANT, application_status: Lease::APPLICATION_STATUS_IN_PROGRESS)
        lease.primary_resident.update(current_step: LeaseResident::STEP_OCCUPANT_DETAILS)
      end

    elsif lease.is_adding_lead?
      lease.update(status: Lease::STATUS_LEAD, application_status: Lease::APPLICATION_STATUS_LEAD)

      if current_user.nil?
        CompanyMailer.send_to_appropriate_users(:lead_added, lease.property, lease.primary_resident.id)
      end

    elsif lease.is_approving_application?
      lease.evaluate_application_status

    elsif lease.is_declining_application?
      lease.evaluate_application_status

    elsif lease.is_beginning_move_in? && lease.is_approved? && lease.lease_start_on.present?

      # Invite the resident to pay the security deposit
      deposit_charge = ResidentCharge.build_unique_charge(ChargeType::DEPOSIT, Charge::FREQUENCY_ONE_TIME, lease, lease.security_deposit, [Date.today, lease.lease_start_on].max, false, true)
      deposit_charge.save

      # Add the Rent charge
      rent_charge = ResidentCharge.build_unique_charge(ChargeType::RENT, Charge::FREQUENCY_MONTHLY, lease, lease.rent, lease.lease_start_on, lease.settings.prorate_rent_at_lease_start_and_end, true)
      rent_charge.save

    elsif lease.is_processing_move_in? && lease.is_approved?
      lease.update({move_in_on: [PaymentService.todays_date(), lease.lease_start_on].max})

      # If the move_in date is today, go ahead and make current
      lease.update({status: lease.move_in_on <= PaymentService.todays_date() ? Lease::STATUS_CURRENT : Lease::STATUS_FUTURE})

      # Make sure everything is posted first
      lease.unposted_charges.each do | charge |
        charge.update({proposed: false, due_on: lease.lease_start_on})
        AccountingService.push_to_ledger(charge)
      end

      if request_params[:lease] && request_params[:lease][:send_lease_letter] == "true"
        lease.reload

        ResidentMailer.welcome_letter(lease.id).deliver
        ResidentTexter.new.welcome_letter(lease.id)
      end

      # Switch the listing off
      unit_listing = UnitListing.where(unit_id: lease.unit_id, listing_type: UnitListing::LISTING_TYPE_SPECIFIC_UNIT).first

      if unit_listing.present?
        unit_listing.status = UnitListing::STATUS_INACTIVE
        unit_listing.save(validate: false)
      end

    elsif lease.is_adjusting_lease_end?

      # Make sure all monthly charges are extended
      lease.resident_charges.where(frequency: Charge::FREQUENCY_MONTHLY).each do | charge |
        AccountingService.push_to_ledger(charge)
      end

    elsif lease.is_adjusting_move_out?

      # Make sure the unit's dates get updated
      lease.unit.update_status

    elsif lease.is_beginning_move_out?

      # Do we know what all of the residents intend to do?
      if lease.move_out_step == Lease::MOVE_OUT_STEP_RENEW_ALL
        lease.primary_resident.update({move_out_intention: LeaseResident::MOVE_OUT_INTENTION_RENEW})
        lease.secondary_residents.each{|secondary_resident| secondary_resident.update({move_out_intention: LeaseResident::MOVE_OUT_INTENTION_RENEW}) }

        lease.copy_for_renewal
        lease.reload
      end

    elsif lease.is_requesting_move_out?

      lease.update({move_out_step: Lease::MOVE_OUT_STEP_RESIDENT_REQUESTED})

      # This is an action taken by the resident
      if lease.primary_resident.move_out_intention == LeaseResident::MOVE_OUT_INTENTION_RENEW
        CompanyMailer.send_to_appropriate_users(:renter_requesting_renewal, lease.property, lease.primary_resident.id)
      elsif lease.primary_resident.move_out_intention == LeaseResident::MOVE_OUT_INTENTION_MOVE_OUT
        CompanyMailer.send_to_appropriate_users(:renter_requesting_move_out, lease.property, lease.primary_resident.id)
      end

      lease.secondary_residents.each do | secondary_resident |
        if secondary_resident.move_out_intention == LeaseResident::MOVE_OUT_INTENTION_RENEW
          CompanyMailer.send_to_appropriate_users(:renter_requesting_renewal, lease.property, secondary_resident.id)
        elsif secondary_resident.move_out_intention == LeaseResident::MOVE_OUT_INTENTION_MOVE_OUT
          CompanyMailer.send_to_appropriate_users(:renter_requesting_move_out, lease.property, secondary_resident.id)
        end
      end

    elsif lease.is_continuing_move_out?

      # Do we know what all of the residents intend to do?
      if lease.move_out_step == Lease::MOVE_OUT_STEP_MOVE_OUT_SOME

        # Is anyone renewing?
        renewing = lease.primary_resident.is_renewing_lease?
        lease.secondary_residents.each{|secondary_resident| renewing ||= secondary_resident.is_renewing_lease? }

        if renewing
          lease.copy_for_renewal
          lease.reload
        else
          lease.update({move_out_step: Lease::MOVE_OUT_STEP_MOVE_OUT_ALL})
        end
      elsif lease.move_out_step == Lease::MOVE_OUT_STEP_COLLECT_ALL_ADDRESSES
        lease.update({move_out_step: Lease::MOVE_OUT_STEP_MOVE_OUT_ALL})
      end

    elsif lease.is_cancelling_move_out?
      lease.update({move_out_step: lease.secondary_residents.empty? ? Lease::MOVE_OUT_STEP_MOVE_OUT_SOME : Lease::MOVE_OUT_STEP_START})

    elsif lease.is_processing_move_out?

      move_out_successful = false

      ActiveRecord::Base.transaction do
        # Remove all future ledger items
        lease.resident_ledger_items.where("DATE(CONVERT_TZ(transaction_at, 'UTC', 'US/Mountain')) > DATE(CONVERT_TZ(now(), 'UTC', 'US/Mountain'))").each do | ledger_item |
          ledger_item.force_destroy
        end

        # Grab all of the new ledger items
        lease.reload

        # Mark all proposed charges as not-proposed and push them into the ledger
        charges = lease.proposed_charges_with_proration()

        charges.each do |charge|
          charge.update({proposed: false})
          AccountingService.push_to_ledger(charge)
        end

        # Grab all of the new ledger items
        lease.reload

        # Handle the refund
        if lease.ledger_balance < 0
          refund_complete = false
          security_deposit_refund_amount = lease.ledger_balance * -1

          # Attempt a refund via ACH
          if lease.security_deposit_refund_mode == Lease::REFUND_MODE_ACH

            payout_result = PaymentService.process_payout(ResidentPayout, lease.primary_resident, lease.security_deposit_refund_payment_method, lease.ledger_balance * -1)

            if payout_result[:status] == Payment::STATUS_SUCCEEDED
              refund_complete = true
            else
              raise payout_result[:api_payment_error_message] || "Unable to perform ACH refund. Please contact support or select a different method."
            end

          else
            # Create a credit, add it to the ledger
            applied_deposit_charge = ResidentCharge.new_for_lease(lease)
            applied_deposit_charge.charge_type_id = ChargeType::DEPOSIT
            applied_deposit_charge.due_on = PaymentService.todays_date()
            applied_deposit_charge.frequency = Charge::FREQUENCY_ONE_TIME
            applied_deposit_charge.amount = security_deposit_refund_amount

            if lease.security_deposit_refund_mode == Lease::REFUND_MODE_PAPER_CHECK_PRINTED
              applied_deposit_charge.description = "Refund by check (queued for printing)"
            elsif lease.security_deposit_refund_mode == Lease::REFUND_MODE_PAPER_CHECK_HANDWRITTEN
              applied_deposit_charge.description = "Refund by check ##{lease.security_deposit_refund_check_number}"
            end

            if applied_deposit_charge.save
              AccountingService.push_to_ledger(applied_deposit_charge)
              ledger_item = ResidentLedgerItem.where(related_object: applied_deposit_charge).first

              # Queue up a expense & expense payment to cover the refund
              expense = Bill.create_for_deposit_refund(ledger_item)

              if expense.present?
                expense.ensure_expense_payment(force = true)
                expense.reload

                AccountingService.generate_entries_for_expense(expense)

                expense_payment = expense.expense_payments.first

                if lease.security_deposit_refund_mode == Lease::REFUND_MODE_PAPER_CHECK_PRINTED
                  # Finally, throw a check in the queue
                  PrintedCheck.create_for_expense_payment(expense_payment)
                elsif lease.security_deposit_refund_mode == Lease::REFUND_MODE_PAPER_CHECK_HANDWRITTEN
                  expense_payment.update(extra_info: lease.security_deposit_refund_check_number)
                end

                # Make sure expense amounts and dates are set
                expense.save
              end

              refund_complete = true
            else
              raise "Unable to perform ACH refund. Please contact support or select a different method."
            end
          end

          if refund_complete
            lease.update({security_deposit_refund_amount: security_deposit_refund_amount})
          end
        end

        # Mark this lease as moved-out
        move_out_successful = lease.update({status: Lease::STATUS_FORMER, move_out_step: Lease::MOVE_OUT_STEP_COMPLETE, move_out_on: [lease.lease_safe_end_on, PaymentService.todays_date()].min})
      end

      # Send the email
      if move_out_successful
        if lease.ledger_balance > 0
          ResidentMailer.move_out_and_pay(lease.id).deliver
        else
          ResidentMailer.move_out_and_refund(lease.id).deliver
        end
      end


    elsif lease.is_cancelling_renewal?

      # Destroy this lease and set the previous lease back to its previous state
      previous_lease = lease.previous_lease
      previous_lease.update({move_out_step: Lease::MOVE_OUT_STEP_START})

      lease.destroy

      # Send the previous lease back to the browser
      lease = previous_lease

    elsif lease.is_processing_renewal?

      # Add the Rent charge
      rent_charge = ResidentCharge.build_unique_charge(ChargeType::RENT, Charge::FREQUENCY_MONTHLY, lease, lease.rent, lease.lease_start_on, lease.settings.prorate_rent_at_lease_start_and_end)
      rent_charge.save

      # If the new lease is beginning today or in the past, create adjustments to move the balance forward
      if lease.lease_start_on > PaymentService.todays_date()
        lease.update({status: Lease::STATUS_FUTURE})

        previous_lease = lease.previous_lease
        previous_lease.update({lease_end_on: lease.lease_start_on})
      else

        LeaseService.roll_renewal_forward_to_next_lease(lease, rent_charge)

      end

      # Send the email
      ResidentMailer.renewal_notice(lease.id).deliver

      # Make sure the unit status is correct
      lease.unit.reload
      lease.unit.update_status

    elsif lease.is_before_move_in?
      # Are there any new co-residents added by a resident
      lease.secondary_residents.where(invitation_sent_at: nil).each do | secondary_resident |
        if ResidentMailer.invitation(secondary_resident.id).deliver
          secondary_resident.current_step ||= LeaseResident::STEP_INVITATION
          secondary_resident.screening_package_id ||= lease.primary_resident.screening_package_id
          secondary_resident.invitation_sent_at = Time.now
          secondary_resident.save(validate: false)
        end
      end

      lease.guarantors.where(invitation_sent_at: nil).each do | guarantor |
        if ResidentMailer.invitation(guarantor.id).deliver
          guarantor.current_step ||= LeaseResident::STEP_INVITATION
          guarantor.screening_package_id ||= lease.primary_resident.screening_package_id
          guarantor.invitation_sent_at = Time.now
          guarantor.save(validate: false)
        end
      end
    end
  end

  def self.roll_renewal_forward_to_next_lease(lease, rent_charge = nil)

    rent_charge ||= lease.resident_charges.where(charge_type_id: ChargeType::RENT).first

    # Balance is rolled forward (credit applied to old lease)
    # TODO... what does this look like near the end of the month?
    # should we use [lease.previous_lease.lease_safe_end_on, PaymentService.todays_date()].min?
    # Create a rolled-forward adjustment per charge_type
    as_of = LedgerItem.future_as_of() # Go as far into the future as we display on the lease
    previously_paid = Payment.where(lease_id: lease.previous_lease_id).succeeded_or_manual.where("convert_tz(payment_at, 'UTC', 'US/Mountain') <= :as_of AND IFNULL(payments.fee_type, '') != :screening_fee_type", {as_of: as_of, screening_fee_type: Setting::PAYMENT_FEE_TYPE_SCREENING_FEE}).sum(:amount)
    previously_paid -= PaymentReturn.joins(:payment).where(lease_id: lease.previous_lease_id).where("convert_tz(payment_returns.payment_at, 'UTC', 'US/Mountain') <= :as_of AND IFNULL(payments.fee_type, '') != :screening_fee_type", {as_of: as_of, screening_fee_type: Setting::PAYMENT_FEE_TYPE_SCREENING_FEE}).sum(:amount)

    unpaid_charges = []
    ResidentLedgerItem.as_of(as_of).where(lease_id: lease.previous_lease_id).order(:transaction_at).each do | ledger_item|
      if ledger_item.related_object.is_a?(Charge) && ledger_item.transaction_at.in_time_zone('US/Mountain').to_date <= as_of
        # Take previous payments into account
        if previously_paid > 0
          ledger_item.open_amount = [ledger_item.amount - previously_paid, 0].max
          previously_paid -= ledger_item.amount
        else
          ledger_item.open_amount = ledger_item.amount
        end

        unpaid_charges << ledger_item
      end
    end

    sum_by_charge_type = unpaid_charges.inject({}) do | sum_by_charge_type, unpaid_charge|
      charge_type_id = unpaid_charge.related_object.is_a?(Charge) ? unpaid_charge.related_object.charge_type_id : ChargeType::FEES
      sum_by_charge_type[charge_type_id] ||= 0
      sum_by_charge_type[charge_type_id] += unpaid_charge.open_amount
      sum_by_charge_type
    end

    # Create credits on the old lease
    sum_by_charge_type.each do | charge_type_id, amount|
      if amount != 0
        ResidentCharge.create_adjustment(lease.previous_lease, charge_type_id, "#{amount > 0 ? 'Balance' : 'Credit'} rolled to new lease", amount * -1)
        ResidentCharge.create_adjustment(lease, charge_type_id, "#{amount > 0 ? 'Balance' : 'Credit'} rolled from old lease", amount)
      end
    end

    # If we still have some left over, add a credit
    if previously_paid > 0
      ResidentCharge.create_adjustment(lease.previous_lease, ChargeType::RENT, "Credit rolled to new lease", previously_paid)
      ResidentCharge.create_adjustment(lease, ChargeType::RENT, "Credit rolled from old lease", previously_paid * -1)
    end

    # Mark the old lease as former and this lease as future or current
    lease.previous_lease.update({status: Lease::STATUS_FORMER, move_out_on: [lease.previous_lease.lease_safe_end_on, PaymentService.todays_date()].min})
    lease.update({status: Lease::STATUS_CURRENT})

    # Are we pro-rating rent? If not, the last month's rent has been already taken care of so start charging next month
    start_charging_on = lease.lease_start_on.day == 1 ? lease.lease_start_on : lease.lease_start_on.end_of_month + 1.day

    # Make sure everything is posted first
    lease.unposted_charges.each do | charge |
      charge.update({proposed: false, due_on: start_charging_on})
      AccountingService.push_to_ledger(charge)
    end

    # Scenario: lease ends June 15th, June 1 rent is prorated or full. Lease renewed on July 2nd, we need to make sure June was fully-charged for and that July is too
    previous_rent_charge = lease.previous_lease.resident_charges.where(charge_type_id: ChargeType::RENT).first
    final_months_rent_previous_lease = lease.previous_lease.resident_ledger_items.where(related_object: previous_rent_charge).where("DATE(CONVERT_TZ(transaction_at, 'UTC', 'US/Mountain')) BETWEEN :start_of_month AND :end_of_month", {start_of_month: lease.previous_lease.lease_safe_end_on.beginning_of_month, end_of_month: lease.previous_lease.lease_safe_end_on.end_of_month}).inject(0) {|sum, li| sum + li.amount}

    # Was the final month rent charged in full? If not, add the difference using the new rent
    if final_months_rent_previous_lease < previous_rent_charge.amount
      final_months_rent_next_lease = lease.resident_ledger_items.where(related_object: rent_charge).where("DATE(convert_tz(transaction_at, 'UTC', 'US/Mountain')) BETWEEN :start_of_month AND :end_of_month", {start_of_month: lease.lease_start_on.beginning_of_month, end_of_month: lease.lease_start_on.end_of_month}).inject(0) {|sum, li| sum + li.amount}

      if final_months_rent_next_lease == 0
        ResidentLedgerItem.create_for_charge(rent_charge, lease.lease_start_on, rent_charge.amount - final_months_rent_previous_lease)
      end
    end

    current_date = start_charging_on

    while current_date <= PaymentService.todays_date().beginning_of_month
      # Have we charged rent for this month?
      first_months_rent_next_lease = lease.resident_ledger_items.where(related_object: rent_charge).where("DATE(convert_tz(transaction_at, 'UTC', 'US/Mountain')) BETWEEN :start_of_month AND :end_of_month", {start_of_month: current_date, end_of_month: current_date.end_of_month}).inject(0) {|sum, li| sum + li.amount}

      if first_months_rent_next_lease == 0
        ResidentLedgerItem.create_for_charge(rent_charge, current_date, rent_charge.amount)
      end

      current_date += 1.month
    end
  end

  def self.create_applied_deposit_charge(lease)

    applied_deposit_charge = ResidentCharge.new_for_lease(lease)
    applied_deposit_charge.charge_type_id = ChargeType::DEPOSIT
    applied_deposit_charge.description = "Applied Security Deposit"
    applied_deposit_charge.due_on = PaymentService.todays_date()
    applied_deposit_charge.prorated = false
    applied_deposit_charge.proposed = true
    applied_deposit_charge.frequency = Charge::FREQUENCY_ONE_TIME
    applied_deposit_charge.amount = lease.security_deposit_paid * -1

    applied_deposit_charge.save

    return applied_deposit_charge
  end

  def self.cancel_move_in(lease, payments_to_refund)

    all_refunds_successful = true

    # Refund all specified payments
    if payments_to_refund.present?

      ledger_items = LedgerItem.where(hash_id: payments_to_refund)

      ledger_items.each do | ledger_item |
        if all_refunds_successful
          result = PaymentService.refund_payment(ledger_item.related_object, current_user, request)
          all_refunds_successful &&= result[:success]
        end
      end
    end

    if all_refunds_successful
      lease.move_in_on = nil
      lease.lease_start_on = nil
      lease.lease_end_on = nil

      # Is the cancellation of a renewal?  If so, we need to roll this and the previous lease back
      if lease.previous_lease.present?
        lease.status = Lease::STATUS_CANCELLED
        lease.previous_lease.status = Lease::STATUS_CURRENT
        lease.previous_lease.move_out_step = nil
        lease.previous_lease.move_out_on = nil

      else
        lease.status = Lease::STATUS_APPROVED
      end

      if lease.save && (lease.previous_lease.nil? || lease.previous_lease.save)

        # Do we need to move money back to the previous lease?
        if lease.previous_lease.present?
          if lease.ledger_balance > 0

            as_of = LedgerItem.future_as_of() # Go as far into the future as we display on the lease
            sum_by_charge_type = ResidentLedgerItem.as_of(as_of || PaymentService.todays_date()).where(lease_id: lease.id).inject({}) do | sum_by_charge_type, ledger_item|
              charge_type_id = ledger_item.related_object.is_a?(Charge) ? ledger_item.related_object.charge_type_id : ChargeType::FEES
              sum_by_charge_type[charge_type_id] ||= 0
              sum_by_charge_type[charge_type_id] += ledger_item.amount
              sum_by_charge_type
            end

            # Create credits on the old lease
            sum_by_charge_type.each do | charge_type_id, amount|
              if amount != 0
                ResidentCharge.create_adjustment(lease.previous_lease, charge_type_id, "#{amount > 0 ? 'Balance' : 'Credit'} rolled from cancelled renewal", amount)
                ResidentCharge.create_adjustment(lease, charge_type_id, "#{amount > 0 ? 'Balance' : 'Credit'} rolled back for cancelled renewal", amount * -1)
              end
            end
          end

          # Finally, sever the connection
          lease.update({previous_lease_id: nil})
        end

        # If there are any payments, remove only the unpaid_charges. Other wise, remove everything
        if Payment.where(lease: lease).exists?
          lease.unpaid_charges.each do | ledger_item |
            ledger_item.force_destroy
          end
        else
          lease.resident_ledger_items.each do | ledger_item |
            ledger_item.force_destroy
          end
        end

        return :success
      else
        return :failed_update
      end
    else
      return :refund_failed
    end
  end

  def self.debug_save_ledger(lease, as_of, filename = nil)
    filename ||= "ledger-#{Time.now.to_i}"
    as_of = lease.status == Lease::STATUS_FUTURE ? lease.lease_start_on : LedgerItem.future_as_of() if as_of.nil?
    rows = []

    ResidentLedgerItem.as_of(as_of || PaymentService.todays_date()).where(lease_id: lease.id).each  do | ledger_item |
      row = [ledger_item.id, ledger_item.transaction_at, ledger_item.related_object&.description_pretty, ledger_item.amount]
      rows << CSV.generate_line(row, {force_quotes: true})
    end

    File.open("log/test-#{filename}.csv", "w") do | f|
      f.write(rows.join(""))
    end
  end
end