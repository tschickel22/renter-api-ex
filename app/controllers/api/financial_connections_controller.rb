class Api::FinancialConnectionsController < Api::ApiController

  before_action :set_bank_transaction, only: [:bank_transaction, :bank_transaction_matches, :save_bank_transaction_match]

  def start
    # To start the process, we need to create a Stripe Customer
    if current_user.company.external_stripe_id.blank?
      current_user.company.external_stripe_id = RenterInsightStripeApi.new.create_customer(current_user.company, request)
      current_user.company.save(validate: false)
    end

    if !current_user.company.external_stripe_id.blank?
      financial_connection_session = RenterInsightStripeApi.new.start_financial_connection_session(current_user.company, request)

      if financial_connection_session.present?
        render_json(financial_connection_session.to_hash.slice(:client_secret))
      else
        render_json({errors: {base: "Unable to continue financial connection process"}}, false)
      end
    else
      render_json({errors: {base: "Unable to begin financial connection process"}}, false)
    end
  end

  def store
    # Just dump this into ApiLogs
    ApiLog.create(api_partner_id: RenterInsightStripeApi::API_PARTNER_ID, action: 'end_financial_connection_session', status: "success", response: params[:financial_connection_session].to_json, ip_address: request.remote_ip, response_time: 1)

    render_json({stored: true})
  end

  def save_account_mapping
    bank_accounts = BankAccount.for_user(current_user)

    if params[:bank_account_mapping]
      params[:bank_account_mapping].each do | bank_account_id, stripe_account_id |
        bank_account = bank_accounts.where(id: bank_account_id).first
        bank_account.external_stripe_id = stripe_account_id
        bank_account.save

        UpdateBankTransactions.enqueue(bank_account.id)
      end

      render_json({mapping_saved: true})
    else
      render_json({errors: {base: "Unable to save account mapping"}}, false)
    end
  end

  def save_account_unlinking

    bank_accounts = BankAccount.for_user(current_user)

    if params[:bank_account_ids]

      bank_accounts.where(id: params[:bank_account_ids]).each do | bank_account |
        bank_account.bank_transactions.destroy_all()
        bank_account.external_stripe_id = nil
        bank_account.save
      end

      render_json({unlinking_saved: true})
    else
      render_json({errors: {base: "Unable to unlink accounts"}}, false)
    end
  end

  def bank_transactions

    bank_account = BankAccount.for_user(current_user).where(hash_id: params[:id]).first

    if bank_account.present?
      bank_transactions = bank_account.bank_transactions.includes(:company, :property, :bank_account, :related_object).where(status: (params[:status] || "unknown"))

      # Limit by date
      bank_transactions = bank_transactions.where("date(convert_tz(transacted_at, 'UTC', 'US/Mountain')) >= date(:from_date)", from_date: params[:from_date]) if !params[:from_date].blank?
      bank_transactions = bank_transactions.where("date(convert_tz(transacted_at, 'UTC', 'US/Mountain')) <= date(:to_date)", to_date: params[:to_date]) if !params[:to_date].blank?

      # Limit by search_text
      bank_transactions = bank_transactions.where(["description like :search_text or amount like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?

      # Run matching on new transactions
      if params[:status] == BankTransaction::STATUS_NEW
        matcher = RenterInsightBankTransactionMatcher.new(current_user, bank_account)
        matcher.perform(bank_transactions)
      end

      if params[:status] == BankTransaction::STATUS_EXCLUDED
        render_json({bank_transactions: bank_transactions})
      else
        render_json({bank_transactions: bank_transactions.collect{|bt| bt.to_builder("full").attributes!}})
      end
    else
      render_json({errors: {base: "Bank account not found"}}, false)
    end
  end

  def bank_transaction

    if @bank_account.present?
      render_json({bank_transaction: @bank_transaction.to_builder("full").attributes!})
    else
      render_json({errors: {base: "Bank account not found"}}, false)
    end
  end

  def bank_transaction_matches

    if @bank_transaction.present?

      # Is this an expense?
      if @bank_transaction.amount < 0
        expenses = Expense.for_user(current_user)

        # Limit by date
        expenses = expenses.where("paid_on >= date(:from_date)", from_date: params[:from_date]) if !params[:from_date].blank?
        expenses = expenses.where("paid_on <= date(:to_date)", to_date: params[:to_date]) if !params[:to_date].blank?

        # Limit by account
        expenses = expenses.where(payment_account_id: @bank_transaction.bank_account.account_id)

        # Limit by search text
        if !params[:search_text].blank?
          expenses = expenses.where(["hash_id like :search_text or description like :search_text", {search_text: "%#{params[:search_text]}%"}])
        end

        # Build a list of Expense IDs so that we can eliminate any already-tagged expenses
        expense_ids = expenses.pluck(:id)

        existing_bank_transactions = BankTransaction.where(related_object_id: expense_ids, related_object_type: Expense).pluck(:related_object_id)

        related_objects = expenses.filter{|e| !existing_bank_transactions.include?(e.id) }.collect{|e| e.to_builder.attributes!}
      else
        deposits = Deposit.for_user(current_user)

        # Limit by date
        deposits = deposits.where("deposit_on >= date(:from_date)", from_date: params[:from_date]) if !params[:from_date].blank?
        deposits = deposits.where("deposit_on <= date(:to_date)", to_date: params[:to_date]) if !params[:to_date].blank?

        # Limit by account
        deposits = deposits.where(bank_account_id: @bank_transaction.bank_account_id)

        # Build a list of Expense IDs so that we can eliminate any already-tagged deposits
        deposit_ids = deposits.pluck(:id)

        existing_bank_transactions = BankTransaction.where(related_object_id: deposit_ids, related_object_type: Deposit).pluck(:related_object_id)

        related_objects = deposits.filter{|e| !existing_bank_transactions.include?(e.id) }.collect{|e| e.to_builder.attributes!}
      end

      render_json({related_objects: related_objects})
    else
      render_json({errors: {base: "Transaction not found"}}, false)
    end
  end

  def save_bank_transaction_match
    if @bank_transaction.present?

      @bank_transaction.related_object_id = params[:related_object_id]
      @bank_transaction.related_object_type = params[:related_object_type]

      if @bank_transaction.related_object.present? && @bank_transaction.save
        render_json({bank_transaction: @bank_transaction})
      else
        render_json({errors: {base: "Could not save transaction match"}}, false)
      end
    else
      render_json({errors: {base: "Transaction not found"}}, false)
    end
  end

  def update_bank_transaction_status
    bank_account = BankAccount.for_user(current_user).where(hash_id: params[:id]).first

    if bank_account.present?
      bank_transactions = bank_account.bank_transactions.where(id: params[:bank_transaction_ids])
      success = true

      if bank_transactions.present?
        bank_transactions.each do | bank_transaction |
          if (bank_transaction.is_new? && params[:status] == BankTransaction::STATUS_EXCLUDED) || (bank_transaction.is_excluded? && params[:status] == BankTransaction::STATUS_NEW)
            success &&= bank_transaction.update({status: params[:status]})

          elsif (bank_transaction.is_categorized? && params[:status] == BankTransaction::STATUS_NEW)

            # Force-destroy the related object and set this back to new
            # Unless it's a deposit... which shouldn't be destroyed
            # Also, if the related object pre-dates the bank transaction don't delete it
            if bank_transaction.related_object.present? && !bank_transaction.related_object.is_a?(Deposit) && bank_transaction.created_at < bank_transaction.related_object.created_at
              bank_transaction.related_object.force_destroy
            end

            bank_transaction.related_object = nil
            bank_transaction.status = BankTransaction::STATUS_NEW
            success &&= bank_transaction.save

          elsif bank_transaction.is_new? && params[:status] == BankTransaction::STATUS_CATEGORIZED && params[:bank_transaction_mapping].present?

            # The user is trying to confirm the mapping. This will come in as a related object key like Expense:9876543 where 9876543 is the hash_id
            related_object_key = params[:bank_transaction_mapping][bank_transaction.id.to_s]

            # Try to find the related object
            related_object_type, related_object_hash_id = related_object_key.split(":")

            related_object = Expense.for_user(current_user).where(hash_id: related_object_hash_id).first if related_object_type == Expense.to_s
            related_object = JournalEntry.for_user(current_user).where(hash_id: related_object_hash_id).first if related_object_type == JournalEntry.to_s
            related_object = Deposit.for_user(current_user).where(hash_id: related_object_hash_id).first if related_object_type == Deposit.to_s

            # Make sure this object hasn't already been mapped
            if related_object.present? && !BankTransaction.where(related_object: related_object).exists?
              bank_transaction.related_object = related_object
              bank_transaction.status = BankTransaction::STATUS_CATEGORIZED
              success &&= bank_transaction.save
            else
              Rails.logger.error("Could not find an unmapped #{related_object_key}")
              success = false
            end

          else
            success = false
          end
        end

        if success
          render_json({bank_transactions: bank_transactions})
        else
          render_json({errors: {base: "Bank transaction updates could not be saved"}}, false)
        end
      else
        render_json({errors: {base: "Bank #{"transaction".pluralize(params[:bank_transaction_ids].length)} not found"}}, false)
      end
    else
      render_json({errors: {base: "Bank account not found"}}, false)
    end
  end

  protected

  def set_bank_transaction
    @bank_account = BankAccount.for_user(current_user).where(hash_id: params[:id]).first
    @bank_transaction = @bank_account.bank_transactions.where(id: params[:bank_transaction_id]).includes(:company, :property, :bank_account, :related_object).first
  end

end