class Api::ChargesController < Api::ApiController
  include ApplicationHelper

  def model_class
    ResidentCharge
  end

  def primary_key_field
    :hash_id
  end

  def handle_before_create_save()
    if @object.is_one_time? && @object.due_on.nil?
      @object.due_on = (@object.lease&.lease_start_on || todays_date())
    # Make sure monthly charge start either today or on the lease start... which ever is latest
    elsif @object.is_monthly? && @object.due_on.nil?
      @object.due_on = [@object.lease&.lease_start_on, todays_date()].max
    end
  end

  def charges_and_ledger_items

    lease = Lease.for_user(current_user).where(hash_id: params[:id]).first

    if lease.present?
      charges = ResidentCharge.where(lease_id: lease.id).active
      as_of = lease.status == Lease::STATUS_FUTURE ? lease.lease_start_on : LedgerItem.future_as_of()

      ledger_items = ResidentLedgerItem.as_of(as_of).where(lease_id: lease.id).order(:transaction_at)
      future_ledger_items = nil # Not always returned

      balance = 0.0
      ledger_items.each do | ledger_item |
        balance += ledger_item.amount
        ledger_item.balance = balance
      end

      if params[:mode] == "open"
        charges = charges.where(frequency: Charge::FREQUENCY_MONTHLY)

        # Run through the ledger tiles and only return everything since the last $0.00
        open_ledger_items = []
        ledger_items.each do | ledger_item |
          open_ledger_items << ledger_item
          open_ledger_items = [] if ledger_item.balance <= 0.0 # Reset when we hit zero
        end

        # Make sure the last ledger item has the final balance
        open_ledger_items.last.balance = balance if !open_ledger_items.empty?

        ledger_items = open_ledger_items

        future_ledger_items = ResidentLedgerItem.between(as_of, as_of + 1.month).where(lease_id: lease.id).order(:transaction_at)

      elsif params[:mode] == "move_out"

        ledger_items = ResidentLedgerItem.as_of(PaymentService.todays_date()).where(lease_id: lease.id).order(:transaction_at)

        balance = 0.0
        ledger_items.each do | ledger_item |
          balance += ledger_item.amount
          ledger_item.balance = balance
        end

        # Create a proposed charge for the security deposit
        if lease.security_deposit_paid > 0

          if charges.find{|c| c.is_deposit? && c.amount < 0}.nil?
            LeaseService.create_applied_deposit_charge(lease)
          elsif applied_deposit_charges = charges.filter{|c| c.is_deposit? && c.amount < 0 && c.proposed?}
            if applied_deposit_charges.count == 1
              applied_deposit_charges.first.update(amount: -1 * lease.security_deposit_paid)
            else
              Rails.logger.error("How did this happen? More than 1 applied security deposit found on lease ##{lease.id}")
            end
          end

        end

        # Only display proposed or monthly charges
        charges = charges.proposed

        # Calculate Proration
        charges.each{|charge| charge.calculate_proration(lease.settings, lease.lease_safe_end_on.beginning_of_month, lease.lease_safe_end_on)}


      elsif params[:mode] == "move_in"

        # Calculate Proration
        charges.each{|charge| charge.calculate_proration(lease.settings, lease.lease_start_on, lease.lease_start_on.end_of_month)}
      end

      render_json({charges: charges, ledger_items: ledger_items, future_ledger_items: future_ledger_items})
    else
      render_json({errors: {lease: 'Not found'}}, false)
    end
  end

  def rent_and_deposit_charges
    # Looking for the recurring rent and lone deposit charges
    lease = Lease.for_user(current_user).where(hash_id: params[:id]).first

    charges = ResidentCharge.where(lease_id: lease.id).active

    rent_charges = []
    deposit_charges = []

    charges.each do | charge |
      if charge.charge_type_id == ChargeType::DEPOSIT
        deposit_charges << charge
      elsif charge.charge_type_id == ChargeType::RENT && charge.is_monthly?
        rent_charges << charge
      end
    end

    render_json({rent_charges: rent_charges, deposit_charges: deposit_charges})
  end

  def ledger_item_details
    lease = Lease.for_user(current_user).where(hash_id: params[:id]).first

    if lease.present?
      ledger_item = ResidentLedgerItem.includes(:related_object).where(hash_id: params[:ledger_item_id]).first

      if ledger_item.is_charge
        render_json({ledger_item: ledger_item, charge: ledger_item.related_object})
      elsif ledger_item.is_payment
        render_json({ledger_item: ledger_item, payment: ledger_item.related_object})
      elsif ledger_item.is_payment_return
        render_json({ledger_item: ledger_item, payment_return: ledger_item.related_object})
      end

    else
      render_json({errors: {lease: 'Not found'}}, false)
    end
  end

  def destroy
    load_object_for_update

    if @object.present? && @object.destroy
      render_successful_update()
    else
      render_failed_update
    end
  end


  protected

  def handle_after_create

    # We now push all charges, until the end of the lease, into the ledger
    handle_after_save

    ResidentMailer.charge_added(@object.id).deliver if params[:charge][:send_resident_payment_link] === true

  end

  def handle_after_update
    handle_after_save
  end

  def handle_after_save
    # Special case - if this was a deposit or rent charge, update the lease to reflect
    if @object.is_deposit?
      @object.lease.update({security_deposit: @object.amount})
    elsif @object.is_rent? && @object.is_monthly?
      @object.lease.update({rent: @object.amount})
    end

    # Update the ledger
    AccountingService.push_to_ledger(@object)

    # Did the deposit change?
    # If so, we need to move money from deposit to rent or vice versa
    if @object.is_deposit? && @object.saved_changes["amount"].present?

      deposit_account = Account.where(company_id: @object.company_id, code: ChargeType.find(ChargeType::DEPOSIT).account_code).first

      difference = @object.saved_changes["amount"].last - @object.saved_changes["amount"].first

      Rails.logger.error("Updating account entries for deposit change of #{difference} on lease ##{@object.lease_id}")

      # Repost all payments until we've covered the deposit
      payments = Payment.succeeded_or_manual.where(lease_id: @object.lease_id).order(:payment_at)
      total_applied = 0

      payments.each do | payment |
        next if payment.payment_return.present?
        next if total_applied >= @object.amount

        # Update the account entries
        AccountingService.fix_payment_entries(payment)
        payment_ledger_item = LedgerItem.where(related_object: payment).first

        # Then total up what we have applied to Deposit
        total_applied += AccountEntry.where(related_object: payment_ledger_item).collect{|p| p.cash_account_id == deposit_account.id ? p.amount : 0}.sum

        Rails.logger.error("After updating entries for payment ##{payment.id}, total applied is #{total_applied} on lease ##{@object.lease_id}")
      end

      # Update security_deposit_paid to reflect this change
      AccountingService.update_security_deposit_paid(@object.lease)

    end
  end

  def object_params
    cp = parse_number_param(params.require(:charge).permit(ResidentCharge.public_fields + [:send_resident_payment_link]), [:amount])

    # Translate the lease_id
    if !cp[:lease_id].blank?
      lease = Lease.where(hash_id: cp[:lease_id]).first

      if lease.present?
        cp[:lease_id] = lease.id
        cp[:property_id] = lease.property_id
      end
    end

    return cp
  end

end