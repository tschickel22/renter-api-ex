class Api::AccountReconciliationsController < Api::ApiController

  def model_class
    AccountReconciliation
  end

  def primary_key_field
    :hash_id
  end

  def show
    render_json({ singular_object_key() => model_class().for_user(current_user).where(hash_id: params[:id]).first })
  end

  def perform_search(account_reconciliations)
    account_reconciliations = account_reconciliations.joins(:bank_account).where(["bank_accounts.name like :search_text", {search_text: "%#{params[:search_text]}%"}])
    account_reconciliations = account_reconciliations.where(bank_account_id: params[:bank_account_id]) if !params[:bank_account_id].blank?

    if !params[:start_date].blank? && !params[:end_date].blank?
      account_reconciliations = account_reconciliations.where("(begin_on BETWEEN :start_date AND :end_date) OR (end_on BETWEEN :start_date AND :end_date)", {start_date: params[:start_date], end_date: params[:end_date]})
    end

    return account_reconciliations
  end

  def search
    account_reconciliations = perform_search(AccountReconciliation.for_user(current_user))
    account_reconciliations, total = page(account_reconciliations)

    # For closed reconciliations, look for differences
    account_reconciliations.each do | account_reconciliation |
      account_reconciliation.update_cleared_balance()
    end

    render_json({ plural_object_key() => account_reconciliations.collect{|o| o.to_builder().attributes! }, total: total  })
  end

  def find_most_recent
    account_reconciliation = AccountReconciliation.for_user(current_user).where(bank_account_id: params[:bank_account_id]).order(:end_on).last

    render_json({account_reconciliation: account_reconciliation})
  end

  def account_entries
    load_object_for_update()

    bank_account_ids = BankAccount.for_user(current_user).where(account_id: @object.bank_account.account_id).pluck(:id)

    if @object.is_closed?
      account_entries = @object.account_entries
    else
      account_entries = AccountEntry.where(cash_account_id: @object.bank_account.account_id, related_object_type: AccountReconciliation::SUPPORTED_ACCOUNT_ENTRY_TYPES).includes(:property, :related_object)
      account_entries = account_entries.where("entry_on <= :end_on", {end_on: @object.end_on})
    end

    # Group by related_object
    grouped_account_entries = account_entries.inject({}) do | acc, account_entry |

      # Skip account entries that are assigned to a different account_reconciliation
      if account_entry.related_object.nil? || (account_entry.related_object.account_reconciliation_id.present? && account_entry.related_object.account_reconciliation_id != @object.id)
        acc
      else
        # Payments must be a part of a deposit, unless they're manual
        if account_entry.related_object.is_a?(LedgerItem) && account_entry.related_object.related_object.is_a?(Payment) && !account_entry.related_object.related_object.is_manual?
          deposit_item = DepositItem.joins(:deposit).where(payment_id: account_entry.related_object.related_object_id, deposit: {bank_account_id: bank_account_ids}).first

          if deposit_item.nil?
            acc
          # Roll payments up by deposit
          else
            related_object_type_and_id = "Deposit:#{deposit_item.deposit_id}"

            if acc[related_object_type_and_id].nil?
              acc[related_object_type_and_id] = account_entry
              acc[related_object_type_and_id].amount = account_entry.amount
            else
              acc[related_object_type_and_id].amount += account_entry.amount
            end
          end
        # Payment returns must have a payment that, itself, was deposited to the bank
        elsif account_entry.related_object.is_a?(LedgerItem) && account_entry.related_object.related_object.is_a?(PaymentReturn)
          deposit_item = DepositItem.joins(:deposit).where(payment_id: account_entry.related_object.related_object.payment_id, deposit: {bank_account_id: bank_account_ids}).first

          if deposit_item.nil?
            acc # No deposit... don't count this return
          else
            if acc[account_entry.related_object_type_and_id].nil?
              acc[account_entry.related_object_type_and_id] = account_entry
              acc[account_entry.related_object_type_and_id].amount = account_entry.amount
            else
              acc[account_entry.related_object_type_and_id].amount += account_entry.amount
            end
          end
        else

          if acc[account_entry.related_object_type_and_id].nil?
            acc[account_entry.related_object_type_and_id] = account_entry
            acc[account_entry.related_object_type_and_id].amount = account_entry.amount
          else
            acc[account_entry.related_object_type_and_id].amount += account_entry.amount
          end
        end

        acc
      end
    end

    render_json({account_entries: grouped_account_entries.values})
  end

  def handle_before_update_save()

    bank_account_ids = BankAccount.for_user(current_user).where(account_id: @object.bank_account.account_id).pluck(:id)

    # Make sure all Ledger Items from a single deposit are included
    deposit_ids = @object.account_entry_object_ids.inject([]) do | acc, object_id |
      related_object_type = object_id.split(':').first
      related_object_id = object_id.split(':').last

      if related_object_type == LedgerItem.to_s
        ledger_item = LedgerItem.find(related_object_id)

        if ledger_item.related_object.is_a?(Payment) && ledger_item.related_object.status == Payment::STATUS_SUCCEEDED
          acc << ledger_item.related_object.deposit_item.deposit_id
        end
      end

      acc
    end

    payment_ids = DepositItem.joins(:deposit).where(deposit_id: deposit_ids, deposit: {bank_account_id: bank_account_ids}).pluck(:payment_id).uniq
    ledger_item_ids = LedgerItem.where(related_object_type: Payment.to_s, related_object_id: payment_ids).collect{|li| "#{LedgerItem.to_s}:#{li.id}"}

    @object.account_entry_object_ids += ledger_item_ids

    @object.account_entry_object_ids.uniq!
  end

  def finalize
    load_object_for_update()

    @object.status = AccountReconciliation::STATUS_CLOSED
    @object.closed_at = Time.now
    @object.closed_by_user_id = current_actual_user.id

    # Take all of the account entries, and calculate the cleared balance
    @object.update_cleared_balance()

    if @object.save

      # Mark all account entries with this ID
      @object.account_entries.each do | account_entry|
        if account_entry.related_object.is_a?(JournalEntry)
          puts "How could this be?"
        else
          account_entry.related_object.account_reconciliation_id = @object.id
          account_entry.related_object.save(validate: false)
        end
      end

      # Update the latest reconciliation date on the bank 
      @object.bank_account.reconciled_until = @object.end_on
      @object.bank_account.save(validate: false)

      render_successful_update()
    else
      render_failed_update()
    end
  end

  def handle_before_create
    @object.status = AccountReconciliation::STATUS_OPEN
  end

  protected

  def object_params
    cp = parse_number_param(params.require(:account_reconciliation).permit(AccountReconciliation.public_fields + [account_entry_object_ids: []]), [:beginning_balance, :ending_balance])

    return cp
  end
end