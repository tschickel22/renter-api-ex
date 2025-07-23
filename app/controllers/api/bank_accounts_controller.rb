class Api::BankAccountsController < Api::ApiController

  def model_class
    BankAccount
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(bank_accounts)
    bank_accounts
  end

  def reconcilable
    # Accounts can be property-specific... but we always want to reference the company account
    bank_accounts = BankAccount.for_user(current_user).where.not(account_id: nil).order(:property_id)
    bank_accounts_by_account_id = bank_accounts.inject({}) do | acc, bank_account |

      if acc[bank_account.account_id].nil?
        acc[bank_account.account_id] = bank_account

        # Sneak in an update of the unconfirmed transactions count
        bank_account.update_unconfirmed_transactions
        bank_account.save
      end

      acc
    end
    render_json(bank_accounts: bank_accounts_by_account_id.values)
  end

  def for_account
    bank_account = BankAccount.for_user(current_user).where(account_id: params[:id]).order(:property_id).first
    render_json(bank_account: bank_account)
  end

  def handle_after_create
    handle_after_create_or_update()
  end

  def handle_after_update
    if @object.saved_change_to_name?
      # Push name change over to Bank Account
      if @object.account.present?
        @object.account.name = @object.name
        @object.account.save
      end
    end

    # Special condition... if this bank account has 1 account reconciliation in progress, update its start date
    if @object.saved_change_to_opened_on? || @object.saved_change_to_opening_balance?
      if AccountReconciliation.where(bank_account: @object).count == 1 && (account_reconciliation = AccountReconciliation.where(bank_account: @object).first).status == AccountReconciliation::STATUS_OPEN
        account_reconciliation.begin_on = @object.opened_on
        account_reconciliation.beginning_balance = @object.opening_balance
        account_reconciliation.save(validate: false)
      end
    end

    handle_after_create_or_update()
  end

  def handle_after_create_or_update()
    # Make sure the beginning balance is reflected in the GL
    if @object.opening_balance.present? && @object.opened_on.present?

      # Find any entry that touches
      opening_balance_splits = JournalEntrySplit.joins(:journal_entry, :account).includes(:journal_entry).where(journal_entry: {company_id: @object.company_id}, account: {code: Account::CODE_OPENING_BALANCE_ACCOUNT})

      matching_journal_entry = nil

      opening_balance_splits.each do | opening_balance_split |
        if opening_balance_split.journal_entry.journal_entry_splits.where(account_id: @object.account_id).exists?
          matching_journal_entry = opening_balance_split.journal_entry
        end
      end

      # If we already had a journal entry and now the amount is zero, wipe it all out
      if matching_journal_entry.present? && @object.opening_balance == 0
        matching_journal_entry.force_destroy()
      end

      if @object.opening_balance != 0

        matching_journal_entry = JournalEntry.new(company_id: @object.company_id, frequency: JournalEntry::FREQUENCY_ONE_TIME, memo: "Opening Balance") if matching_journal_entry.nil?

        bank_account_split = matching_journal_entry.journal_entry_splits.where(account_id: @object.account_id).first_or_initialize
        equity_account_split = matching_journal_entry.journal_entry_splits.where(account: Account.where(company_id: @object.company_id, code: Account::CODE_OPENING_BALANCE_ACCOUNT).first).first_or_initialize

        bank_account_split.debit_amount = @object.opening_balance
        equity_account_split.credit_amount = @object.opening_balance
        bank_account_split.account_reconciliation_id = -1 # Never to be reconciled
        equity_account_split.account_reconciliation_id = -1 # Never to be reconciled

        matching_journal_entry.entry_on = @object.opened_on

        # This shouldn't fail... but what if it does?
        if matching_journal_entry.save

          bank_account_split.journal_entry = matching_journal_entry
          equity_account_split.journal_entry = matching_journal_entry

          bank_account_split.save()
          equity_account_split.save()

          matching_journal_entry.reload

          AccountingService.generate_entries_for_journal_entry(matching_journal_entry)

        else
          raise "Unable to create beginning balance journal entry: #{matching_journal_entry.errors.full_messages.join(", ")}"
        end
      end
    end
  end

  protected

  def object_params
    parse_number_param(params.require(:bank_account).permit(BankAccount.public_fields + [:in_account_setup]), [:opening_balance])
  end
end