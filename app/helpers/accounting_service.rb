class AccountingService

  def self.push_to_ledger(related_object, amount_for_ledger: nil)

    ActiveRecord::Base.transaction do
      if related_object.is_a?(ResidentCharge)
        ledger_item = self.push_resident_charge(related_object)
      elsif related_object.is_a?(ResidentPayment)
        ledger_item = self.push_resident_payment(related_object, amount_for_ledger)
      elsif related_object.is_a?(CompanyPayment)
        ledger_item = self.push_company_payment(related_object, amount_for_ledger)
      elsif related_object.is_a?(ResidentPayout)
        ledger_item = self.push_resident_payout(related_object, amount_for_ledger)
      elsif related_object.is_a?(PaymentReturn)
        ledger_item = self.push_payment_return(related_object)
      elsif related_object.is_a?(CompanyCharge)
        # We are not posting company charges to the ledger. But we will to the GL:
        self.generate_entry_for_company_charge(related_object)
      else
        raise "Unknown ledger item related object type"
      end

      generate_entry(ledger_item)
    end
  end

  def self.generate_entry(ledger_item)
    if ledger_item.present? && ledger_item.valid?
      if ledger_item.related_object.is_a?(ResidentCharge)
        # Already handled
      elsif ledger_item.related_object.is_a?(Payment)
        self.generate_entries_for_payment_ledger_item(ledger_item)
      elsif ledger_item.related_object.is_a?(PaymentReturn)
        self.generate_entry_for_payment_return_ledger_item(ledger_item)
      else
        raise "Unknown ledger item related object type"
      end
    end
  end

  def self.generate_late_fee(lease, on_grace_day_only = false)

    if lease.ledger_balance(PaymentService.todays_date()) > 0
      settings = lease.settings

      puts "Lease #{lease.hash_id}: Money is owed at #{lease.property.name}. Late Fee? #{settings.charge_residents_late_rent_fee} Grace: #{settings.grace_period} Owed: #{lease.ledger_balance(PaymentService.todays_date())} > #{settings.late_rent_fee_minimum_amount}"

      ok_to_charge_late_fee = settings.charge_residents_late_rent_fee

      # Are we only charge a late fee on the grace day or is it wide open?
      if on_grace_day_only
        ok_to_charge_late_fee &&= (PaymentService.todays_date().day - 1) == settings.grace_period
      else
        ok_to_charge_late_fee &&= (PaymentService.todays_date().day - 1) >= settings.grace_period
      end

      # Are we still in the lease?
      ok_to_charge_late_fee &&= PaymentService.todays_date() <= lease.lease_safe_end_on

      if ok_to_charge_late_fee && lease.ledger_balance(PaymentService.todays_date()) >= settings.late_rent_fee_minimum_amount
        puts "Lease #{lease.hash_id}: Late fee time!"

        late_fee = ResidentCharge.where(company_id: lease.company_id, property_id: lease.property_id, lease_id: lease.id, charge_type_id: ChargeType::LATE_FEE).where("due_on BETWEEN :start_date AND :end_date", {start_date: PaymentService.todays_date().beginning_of_month, end_date: PaymentService.todays_date().end_of_month}).first_or_initialize

        if late_fee.new_record?
          late_fee.amount = 0
          late_fee.prorated = false
          late_fee.frequency = Charge::FREQUENCY_ONE_TIME
          late_fee.due_on = PaymentService.todays_date()
        end

        ledger_balance_without_late_fee = lease.ledger_balance(PaymentService.todays_date()) - late_fee.amount
        new_late_fee_amount = 0

        #
        # late_rent_fee_charge_type - fixed or fixed_plus_daily
        #
        if settings.late_rent_fee_charge_type == "fixed" || settings.late_rent_fee_charge_type == "fixed_plus_daily"
          new_late_fee_amount += settings.late_rent_fee_charge_fixed
        end

        #
        # late_rent_fee_charge_type - daily or fixed_plus_daily
        #
        if settings.late_rent_fee_charge_type == "daily" || settings.late_rent_fee_charge_type == "fixed_plus_daily"
          new_late_fee_amount += settings.late_rent_fee_charge_daily * (PaymentService.todays_date().day - settings.grace_period)
        end

        #
        # percent_of_balance
        #
        if settings.late_rent_fee_charge_type == "percent_of_balance"
          new_late_fee_amount += ledger_balance_without_late_fee * settings.late_rent_fee_charge_percent / 100.0
        end

        # Round it
        new_late_fee_amount = new_late_fee_amount.round(2)

        # Cap it
        new_late_fee_amount = [new_late_fee_amount, settings.late_rent_fee_maximum_amount].min

        puts "#{late_fee.amount} == #{new_late_fee_amount}"
        if late_fee.amount != new_late_fee_amount
          late_fee.amount = new_late_fee_amount
          late_fee.save
          AccountingService.push_to_ledger(late_fee)
        end
      end
    end
  end

  def self.generate_nsf(lease)
    nsf = ResidentCharge.new(company_id: lease.company_id, property_id: lease.property_id, lease_id: lease.id, charge_type_id: ChargeType::NSF_FEES)

    nsf.amount = lease.settings.nsf_fee
    nsf.prorated = false
    nsf.frequency = Charge::FREQUENCY_ONE_TIME
    nsf.due_on = PaymentService.todays_date

    nsf.save
    AccountingService.push_to_ledger(nsf)

  end

  private
  #
  # Charges have a special place - we need to make sure they follow the rules:
  # One-time charges should only exist in the ledger once
  # Monthly charges should only appear once a month during the span of the lease
  #
  def self.push_resident_charge(charge)
    if !charge.proposed

      # Any changes can only be applied to the future. So force_delete everything that's already in place
      ResidentLedgerItem.where(related_object: charge).where(["transaction_at > :todays_date", {todays_date: PaymentService.todays_date() + 12.hours}]).each do | ledger_item |
        ledger_item.force_destroy
      end

      if charge.is_one_time?
        # If the charge is due today, use the current time
        transaction_at = (charge.due_on == PaymentService.todays_date() ? PaymentService.todays_date() : charge.due_on) + charge.ledger_offset

        ledger_item = ResidentLedgerItem.where(related_object: charge).first
        ledger_item ||= ResidentLedgerItem.new({ company_id: charge.company_id, property_id: charge.property_id, lease_id: charge.lease_id, related_object: charge})
        ledger_item.amount = charge.prorated_amount || charge.amount
        ledger_item.transaction_at = transaction_at
        ledger_item.save

        if ledger_item.present? && ledger_item.valid?
          self.generate_entry_for_resident_charge_ledger_item(ledger_item)
        end

      elsif charge.is_monthly?

        maximum_flexibility = true # Tom wants to allow for backdating starting 2/16/2025

        # Start adding charges at the beginning of next month unless the lease hasn't started yet
        if (maximum_flexibility && charge.saved_change_to_due_on?) || charge.due_on >= PaymentService.todays_date()
          current_date = charge.due_on
        else
          # Is this rent prorated and the lease starts this month? If so, add a charge for this month
          if charge.prorated && charge.lease.lease_start_on >= PaymentService.todays_date().beginning_of_month
            current_date = charge.lease.lease_start_on
          else
            current_date = Date.today.end_of_month + 1.day
          end
        end

        end_date = charge.lease.lease_safe_end_on

        while current_date <= end_date

          # Pro-ration only at the beginning or end
          if current_date == charge.lease.lease_start_on
            charge.calculate_proration(charge.lease.settings, charge.lease.lease_start_on, charge.lease.lease_start_on.end_of_month)
            amount = charge.prorated_amount || charge.amount

          # Pro-ration only at the beginning or end
          elsif ((current_date + 1.month).beginning_of_month - 1.day) >= end_date
            charge.calculate_proration(charge.lease.settings, current_date, end_date)
            amount = charge.prorated_amount || charge.amount
          else
            amount = charge.amount
          end

          # Only add 1 charge a month
          conditions = { company_id: charge.company_id, property_id: charge.property_id, lease_id: charge.lease_id, related_object: charge}
          ledger_item = ResidentLedgerItem.where(conditions).where("DATE(CONVERT_TZ(transaction_at, 'UTC', 'US/Mountain')) BETWEEN :start_of_month AND :end_of_month", {start_of_month: current_date.beginning_of_month, end_of_month: current_date.end_of_month}).first
          ledger_item = ResidentLedgerItem.new(conditions) if ledger_item.nil?

          ledger_item.transaction_at = (current_date + charge.ledger_offset)

          # Do not change the amount of existing & past items
          if ledger_item.new_record? || ledger_item.transaction_at >= PaymentService.todays_date()
            ledger_item.amount = amount
          end

          ledger_item.save

          if ledger_item.present? && ledger_item.valid?
            self.generate_entry_for_resident_charge_ledger_item(ledger_item)
          end

          current_date = (current_date + 1.month).beginning_of_month
        end
      end

    else
      # Cannot push proposed charges to the ledger
    end

    return nil
  end

  def self.push_resident_payment(payment, amount_for_ledger)
    if ResidentLedgerItem.where({ company_id: payment.company_id, property_id: payment.property_id, lease_id: payment.lease_id, related_object: payment}).exists?
      return nil # Go No Further
    elsif payment.fee_type == Setting::PAYMENT_FEE_TYPE_SCREENING_FEE
      return nil # Go No Further - screening fees should not be on the ledger
    else
      ledger_item = ResidentLedgerItem.create({ company_id: payment.company_id, property_id: payment.property_id, lease_id: payment.lease_id, related_object: payment, amount: -1 * (amount_for_ledger || payment.amount), transaction_at: payment.payment_at || Time.now})
    end

    return ledger_item
  end

  def self.push_payment_return(payment_return)
    ResidentLedgerItem.create({ company_id: payment_return.company_id, property_id: payment_return.property_id, lease_id: payment_return.lease_id, related_object: payment_return, amount: payment_return.amount, transaction_at: Time.now})
  end

  def self.push_resident_payout(resident_payout, amount_for_ledger)
    ResidentLedgerItem.create({ company_id: resident_payout.company_id, property_id: resident_payout.property_id, lease_id: resident_payout.lease_id, related_object: resident_payout, amount: (amount_for_ledger || resident_payout.amount), transaction_at: Time.now})
  end

  def self.push_company_payment(company_payment, amount_for_ledger)
    CompanyLedgerItem.create({ company_id: company_payment.company_id, property_id: company_payment.property_id, related_object: company_payment, amount: -1 * (amount_for_ledger || company_payment.amount), transaction_at: Time.now})
  end

  def self.generate_entry_for_resident_charge_ledger_item(charge_ledger_item)

    # Ledger tiles can change... thus we allow for updates here
    core_attrs = {company_id: charge_ledger_item.company_id, property_id: charge_ledger_item.property_id, related_object: charge_ledger_item}

    debit_entry = AccountEntry.where(core_attrs).where(charge_ledger_item.amount >= 0 ? "amount < 0" : "amount > 0").first_or_initialize
    debit_entry.entry_on = charge_ledger_item.transaction_at.in_time_zone('US/Mountain').to_date
    debit_entry.unit_id = charge_ledger_item.lease.unit_id
    debit_entry.accrual_account = Account.where(company_id: charge_ledger_item.company_id, code: Account::CODE_ACCOUNTS_RECEIVABLE).first
    debit_entry.amount = -1 * charge_ledger_item.amount
    debit_entry.save

    credit_entry = AccountEntry.where(core_attrs).where(charge_ledger_item.amount >= 0 ? "amount > 0" : "amount < 0").first_or_initialize
    credit_entry.entry_on = charge_ledger_item.transaction_at.in_time_zone('US/Mountain').to_date
    credit_entry.unit_id = charge_ledger_item.lease.unit_id
    credit_entry.accrual_account = Account.where(company_id: charge_ledger_item.company_id, code: charge_ledger_item.related_object.charge_type.account_code).first
    credit_entry.amount = charge_ledger_item.amount
    credit_entry.save

  end

  def self.generate_entry_for_company_charge(company_charge)

    # Ledger tiles can change... thus we allow for updates here
    core_attrs = {company_id: company_charge.company_id, property_id: company_charge.property_id, related_object: company_charge}

    debit_entry = AccountEntry.where(core_attrs).where(company_charge.amount >= 0 ? "amount < 0" : "amount > 0").first_or_initialize
    debit_entry.entry_on = company_charge.due_on
    debit_entry.unit_id = company_charge.lease.unit_id
    debit_entry.accrual_account = Account.where(company_id: company_charge.company_id, code: company_charge.charge_type.account_code).first
    debit_entry.amount = -1 * company_charge.amount
    debit_entry.save

    credit_entry = AccountEntry.where(core_attrs).where(company_charge.amount >= 0 ? "amount > 0" : "amount < 0").first_or_initialize
    credit_entry.entry_on = company_charge.due_on
    credit_entry.unit_id = company_charge.lease.unit_id
    credit_entry.accrual_account = Account.where(company_id: company_charge.company_id, code: Account::CODE_ACCOUNTS_PAYABLE).first
    credit_entry.amount = company_charge.amount
    credit_entry.save

  end

  #
  # This helper is to test new distribution logic and see how it stacks up to what is already in the database
  #
  def self.test_entries_for_payment(payment)
    # Get the current allocation
    payment_ledger_item = LedgerItem.where(related_object: payment).first

    current_amounts_by_account_id = AccountEntry.where(related_object: payment_ledger_item).group(:accrual_account_id).sum(:amount)
    account_entries = self.build_account_entries_for_payment_ledger_item(payment_ledger_item)
    new_amounts_by_account_id = account_entries.inject({}) do | acc, account_entry |
      acc[account_entry.accrual_account_id] ||= 0
      acc[account_entry.accrual_account_id] += account_entry.amount
      acc
    end

    all_account_ids = (current_amounts_by_account_id.keys + new_amounts_by_account_id.keys).uniq

    differences = all_account_ids.inject({}) do | acc, account_id |
      acc[account_id] = (current_amounts_by_account_id[account_id] || 0) - (new_amounts_by_account_id[account_id] || 0)
      acc
    end

    return differences
  end

  def self.fix_payment_entries(payment_or_return)
    payment_ledger_item = LedgerItem.where(related_object: payment_or_return).first
    AccountEntry.where(related_object: payment_ledger_item).each{|ae| ae.force_destroy}
    AccountingService.generate_entry(payment_ledger_item)
  end

  def self.update_security_deposit_paid(lease)
    deposit_account = Account.where(company_id: lease.company_id, code: ChargeType.find(ChargeType::DEPOSIT).account_code).first

    # Repost all payments until we've covered the deposit
    payments = Payment.succeeded_or_manual.where(lease_id: lease.id).order(:payment_at)
    total_applied = 0

    payments.each do | payment |
      next if payment.payment_return.present?

      payment_ledger_item = LedgerItem.where(related_object: payment).first

      # Then total up what we have applied to Deposit
      total_applied += AccountEntry.where(related_object: payment_ledger_item).collect{|p| p.cash_account_id == deposit_account.id ? p.amount : 0}.sum
    end

    # Update security_deposit_paid to reflect this change
    lease.update(security_deposit_paid: [total_applied, lease.security_deposit].min)
  end

  def self.generate_entries_for_payment_ledger_item(payment_ledger_item)

    # We need to figure out which accounts will get credit here
    account_entries = build_account_entries_for_payment_ledger_item(payment_ledger_item)
    account_entries.each do | account_entry |
      account_entry.save # What to do with an error?
    end

    AccountingService.update_security_deposit_paid(payment_ledger_item.lease)
  end

  def self.build_account_entries_for_payment_ledger_item(payment_ledger_item)

    account_entries = []
    distributions = AccountingService.determine_distribution(payment_ledger_item.lease, payment_ledger_item.amount, payment_ledger_item.transaction_at)

    total_accounted = distributions.values.inject(0) {| sum, amt | sum + amt}
    deposit_charge_type = ChargeType.find(ChargeType::DEPOSIT)
    core_attrs = {company_id: payment_ledger_item.company_id, property_id: payment_ledger_item.property_id, unit_id: payment_ledger_item.lease.unit_id, related_object: payment_ledger_item, entry_on: payment_ledger_item.transaction_at.in_time_zone('US/Mountain').to_date}

    # Credit the appropriate accounts...
    distributions.each do | account_code, amount |
      credit_entry = AccountEntry.new(core_attrs)
      credit_entry.accrual_account = Account.where(company_id: payment_ledger_item.company_id, code: Account::CODE_ACCOUNTS_RECEIVABLE).first
      credit_entry.cash_account = Account.where(company_id: payment_ledger_item.company_id, code: account_code).first
      credit_entry.amount = amount
      account_entries << credit_entry
    end

    operating_bank_account = payment_ledger_item.related_object.property.bank_accounts.where(account_purpose: BankAccount::ACCOUNT_PURPOSE_OPERATING).first

    if operating_bank_account.present? && operating_bank_account.account.present?
      operating_cash_account = operating_bank_account.account
    else
      operating_cash_account = Account.where(company_id: payment_ledger_item.company_id, code: Account::CODE_BANK_CHECKING_ACCOUNT).first
    end

    # And update the various bank and fee accounts
    if payment_ledger_item.related_object.external_processing_fee.present? && payment_ledger_item.related_object.external_processing_fee > 0
      processing_fee_debit_entry = AccountEntry.new(core_attrs)
      processing_fee_debit_entry.cash_account = Account.where(company_id: payment_ledger_item.company_id, code: Account::CODE_MERCHANT_ACCOUNT_FEES).first
      processing_fee_debit_entry.accrual_account = processing_fee_debit_entry.cash_account
      processing_fee_debit_entry.amount = -1 * payment_ledger_item.related_object.external_processing_fee
      account_entries << processing_fee_debit_entry

      processing_fee_debit_entry = AccountEntry.new(core_attrs)
      processing_fee_debit_entry.cash_account = operating_cash_account
      processing_fee_debit_entry.accrual_account = processing_fee_debit_entry.cash_account
      processing_fee_debit_entry.amount = payment_ledger_item.related_object.external_processing_fee
      account_entries << processing_fee_debit_entry
    end

    distributions.each do | account_code, amount |
      payment_net_debit_entry = AccountEntry.new(core_attrs)
      payment_net_debit_entry.cash_account = operating_cash_account
      payment_net_debit_entry.amount = -1 * amount

      # If this is a deposit...and they have a bank account set up to receive deposits, move the money there
      if deposit_charge_type.account_code == account_code
        deposit_bank_account = payment_ledger_item.related_object.property.bank_accounts.where(account_purpose: BankAccount::ACCOUNT_PURPOSE_DEPOSIT).first

        if deposit_bank_account.present? && deposit_bank_account.account.present?
          payment_net_debit_entry.cash_account = deposit_bank_account.account
        end
      end

      payment_net_debit_entry.accrual_account = payment_net_debit_entry.cash_account
      account_entries << payment_net_debit_entry
    end

    # Was this an overpayment? If so, toss the rest into Rent
    if total_accounted < payment_ledger_item.amount.abs
      overpayment_amount = (payment_ledger_item.amount.abs - total_accounted)

      other_income_debit_entry = AccountEntry.new(core_attrs)
      other_income_debit_entry.cash_account = Account.where(company_id: payment_ledger_item.company_id, code: Account::CODE_RENTAL_INCOME).first
      other_income_debit_entry.accrual_account = Account.where(company_id: payment_ledger_item.company_id, code: Account::CODE_ACCOUNTS_RECEIVABLE).first
      other_income_debit_entry.amount = overpayment_amount
      account_entries << other_income_debit_entry

      other_income_debit_entry = AccountEntry.new(core_attrs)
      other_income_debit_entry.cash_account = operating_cash_account
      other_income_debit_entry.accrual_account = other_income_debit_entry.cash_account
      other_income_debit_entry.amount = -1 * overpayment_amount
      account_entries << other_income_debit_entry
    end

    return account_entries
  end

  def self.generate_entry_for_payment_return_ledger_item(payment_return_ledger_item)

    # Find the corresponding payment's entries
    payment_return = payment_return_ledger_item.related_object
    payment_ledger_item = LedgerItem.where(related_object: payment_return.payment).first
    payment_account_entries = AccountEntry.where(related_object: payment_ledger_item)

    core_attrs = {company_id: payment_return_ledger_item.company_id, property_id: payment_return_ledger_item.property_id, unit_id: payment_return_ledger_item.lease.unit_id, related_object: payment_return_ledger_item, entry_on: payment_return_ledger_item.transaction_at.in_time_zone('US/Mountain').to_date}

    # Reverse the entries - we can do this now since we don't do partial returns yet
    payment_account_entries.each do | account_entry |
      reversed_entry = AccountEntry.new(core_attrs)
      reversed_entry.cash_account = account_entry.cash_account
      reversed_entry.accrual_account = account_entry.accrual_account
      reversed_entry.amount = -1 * account_entry.amount
      reversed_entry.save
    end

    AccountingService.update_security_deposit_paid(payment_return_ledger_item.lease)
  end

  def self.generate_entries_for_expense(expense)

    # We need to multiply account splits and property splits... so, if there are 3 account splits and 2 property splits, that will create 6 sets of entries
    # But first, we should just wipe out everything for this expense
    AccountEntry.where(related_object: expense).each{|ae| ae.force_destroy}

    number_of_account_splits = expense.expense_account_splits.count

    # Now, calculate all of the splits
    # ACCRUAL
    expense.expense_account_splits.each_with_index do | expense_account_split, account_split_index |

      total_accrual_amount = 0

      expense.expense_property_splits.each_with_index do | expense_property_split, property_split_index |
        core_attrs = {company_id: expense_property_split.company_id, property_id: expense_property_split.property_id, related_object: expense}

        # Handle rounding issues
        if number_of_account_splits == 1
          amount = expense_property_split.amount
          total_accrual_amount += amount
        elsif (property_split_index + 1) < expense.expense_property_splits.count
          amount = expense_account_split.amount * (expense_property_split.amount / expense.amount)
          amount = amount.round(2)
          total_accrual_amount += amount

        # Last one gets the rest
        else
          amount = expense_account_split.amount - total_accrual_amount
        end

        debit_entry = AccountEntry.new(core_attrs)
        debit_entry.entry_on = expense.due_on
        debit_entry.unit_id = expense_property_split.unit_id
        debit_entry.accrual_account = expense_account_split.account
        debit_entry.amount = -1 * amount
        debit_entry.save

        credit_entry = AccountEntry.new(core_attrs)
        credit_entry.entry_on = expense.due_on
        credit_entry.unit_id = expense_property_split.unit_id
        credit_entry.accrual_account = Account.where(company_id: expense.company_id, code: Account::CODE_ACCOUNTS_PAYABLE).first
        credit_entry.amount = amount
        credit_entry.save
      end
    end

    # CASH
    expense.expense_payments.succeeded_or_manual.each do | expense_payment, payment_index |
      generate_entries_for_expense_payment(expense, expense_payment)
    end
  end

  def self.generate_entries_for_expense_payment(expense, expense_payment, multiplier = 1)
    total_cash_amount = 0

    expense.expense_account_splits.each_with_index do | expense_account_split, account_split_index |
      expense.expense_property_splits.each_with_index do | expense_property_split, property_split_index |
        core_attrs = {company_id: expense_property_split.company_id, property_id: expense_property_split.property_id, related_object: expense}

        # Handle rounding issues
        if ((property_split_index + 1) < expense.expense_property_splits.count) || ((account_split_index + 1) < expense.expense_account_splits.count)
          fractional_amount = expense_payment.amount * ((expense_account_split.amount * (expense_property_split.amount / expense.amount)) / expense.amount)
          fractional_amount = fractional_amount.round(2)
          total_cash_amount += fractional_amount

          # Last one gets the rest
        else
          fractional_amount = expense_payment.amount - total_cash_amount
        end

        debit_entry = AccountEntry.new(core_attrs)
        debit_entry.entry_on = expense_payment.payment_at
        debit_entry.unit_id = expense_property_split.unit_id
        debit_entry.cash_account = expense_account_split.account
        debit_entry.amount = -1 * fractional_amount * multiplier
        debit_entry.save

        credit_entry = AccountEntry.new(core_attrs)
        credit_entry.entry_on = expense_payment.payment_at
        credit_entry.unit_id = expense_property_split.unit_id
        credit_entry.cash_account = expense_payment.from_account
        credit_entry.amount = fractional_amount * multiplier
        credit_entry.save
      end
    end
  end

  def self.generate_reverse_entries_for_expense_payment(expense_payment)
    generate_entries_for_expense_payment(expense_payment.expense, expense_payment, -1)
  end

  def self.generate_entries_for_refunded_deposit(printed_check)
    # We need to multiply account splits and property splits... so, if there are 3 account splits and 2 property splits, that will create 6 sets of entries
    # But first, we should just wipe out everything for this expense
    charge_ledger_item = printed_check.related_object
    AccountEntry.where(related_object: charge_ledger_item).each{|ae| ae.force_destroy}

    if printed_check.is_printed?
      # Ledger tiles can change... thus we allow for updates here
      core_attrs = {company_id: charge_ledger_item.company_id, property_id: charge_ledger_item.property_id, related_object: charge_ledger_item}

      debit_entry = AccountEntry.where(core_attrs).where(charge_ledger_item.amount >= 0 ? "amount < 0" : "amount > 0").first_or_initialize
      debit_entry.entry_on = charge_ledger_item.transaction_at.in_time_zone('US/Mountain').to_date
      debit_entry.unit_id = charge_ledger_item.lease.unit_id
      debit_entry.cash_account = Account.where(company_id: charge_ledger_item.company_id, code: charge_ledger_item.related_object.charge_type.account_code).first
      debit_entry.amount = -1 * charge_ledger_item.amount
      debit_entry.save

      credit_entry = AccountEntry.where(core_attrs).where(charge_ledger_item.amount >= 0 ? "amount > 0" : "amount < 0").first_or_initialize
      credit_entry.entry_on = charge_ledger_item.transaction_at.in_time_zone('US/Mountain').to_date
      credit_entry.unit_id = charge_ledger_item.lease.unit_id
      credit_entry.cash_account = printed_check.bank_account.account
      credit_entry.amount = charge_ledger_item.amount
      credit_entry.save
    end
  end

  def self.generate_entries_for_journal_entry(journal_entry)
    AccountEntry.where(related_object: journal_entry.journal_entry_split_items).each{|ae| ae.force_destroy}

    journal_entry.journal_entry_splits.each do | journal_entry_split |
      journal_entry_split.journal_entry_split_items.each do | journal_entry_split_item |

        core_attrs = {company_id: journal_entry.company_id, property_id: journal_entry.property_id, related_object: journal_entry_split_item}

        if journal_entry_split.amount < 0
          debit_entry = AccountEntry.new(core_attrs)
          debit_entry.entry_on = journal_entry_split_item.entry_on
          debit_entry.unit_id = journal_entry.unit_id
          debit_entry.cash_account = journal_entry_split.account
          debit_entry.accrual_account = debit_entry.cash_account
          debit_entry.amount = journal_entry_split.amount
          debit_entry.description = !journal_entry_split.description.blank? ? journal_entry_split.description : journal_entry.memo
          debit_entry.save
        else
          credit_entry = AccountEntry.new(core_attrs)
          credit_entry.entry_on = journal_entry_split_item.entry_on
          credit_entry.unit_id = journal_entry.unit_id
          credit_entry.cash_account = journal_entry_split.account
          credit_entry.accrual_account = credit_entry.cash_account
          credit_entry.amount = journal_entry_split.amount
          credit_entry.description = !journal_entry_split.description.blank? ? journal_entry_split.description : journal_entry.memo
          credit_entry.save
        end
      end
    end
  end

  def self.determine_distribution(lease, payment_amount, payment_at)
    distributions = {}
    total_accounted = 0
    unpaid_charges = lease.unpaid_charges(payment_at)

    # If there are no unpaid charges... look into the future
    if unpaid_charges.empty?
      previously_paid = lease.payments.succeeded_or_manual.where("payment_at < :payment_at", {payment_at: payment_at}).where("fee_type IS NULL OR fee_type != '#{Setting::PAYMENT_FEE_TYPE_SCREENING_FEE}'" ).sum(:amount)

      unpaid_charges = []
      lease.resident_ledger_items.each do | ledger_item|
        if ledger_item.related_object.is_a?(Charge) && ledger_item.transaction_at > payment_at
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
    end

    unpaid_charges.each do | unpaid_charge |

      # Have we accounted for all $? Are we going over?
      if (total_accounted + unpaid_charge.open_amount) < payment_amount.abs
        amount = unpaid_charge.open_amount
      else
        amount = payment_amount.abs - total_accounted
      end

      if amount != 0
        distributions[unpaid_charge.related_object.charge_type.account_code] ||= 0
        distributions[unpaid_charge.related_object.charge_type.account_code] += amount
        total_accounted += amount
      end
    end

    return distributions
  end

  def self.calculate_balances(current_user, accounts)
    data = ActiveRecord::Base.connection.select_all("SELECT cash_account_id, SUM(CASE WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}', '#{Account::TYPE_EXPENSES}') THEN -1 * account_entries.amount ELSE NULL END) balance FROM accounts, account_entries WHERE accounts.id = account_entries.cash_account_id AND (account_entries.property_id IS NULL OR account_entries.property_id in (SELECT id FROM properties WHERE status = '#{Property::STATUS_ACTIVE}' AND accounts.company_id = #{current_user.company_id})) AND accounts.company_id = #{current_user.company_id} AND cash_account_id IS NOT NULL AND cash_account_id in (#{accounts.collect{|a| a.id}.join(",")}) AND account_entries.entry_on <= date(convert_tz(now(), 'UTC', 'US/Mountain')) GROUP BY cash_account_id")

    arranged_data = data.inject({}) { |acc, row | acc[row["cash_account_id"]] = row["balance"] ; acc }

    accounts.each do | account |
      account.balance = arranged_data[account.id]
    end

  end
end