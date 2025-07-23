class UpdateBankTransactions

  def self.enqueue(bank_account_id)
    Resque.enqueue_to("banking", UpdateBankTransactions, bank_account_id)
  end

  def self.perform(bank_account_id = nil)
    log("--- Starting #{self.to_s} bank_account_id:#{bank_account_id} ---")

    if bank_account_id.nil?
      Company.all.each do | company |
        if company.is_paying?
          BankAccount.where(company_id: company.id).where.not(external_stripe_id: nil).each do | bank_account |
            UpdateBankTransactions.enqueue(bank_account.id)
          end
        end
      end
    else
      run(bank_account_id)
    end

    log("--- Stopping #{self.to_s} ---")
  end

  def self.run(bank_account_id)
    refresh_balance = false
    bank_account = BankAccount.find(bank_account_id)
    api = RenterInsightStripeApi.new

    # This needs to happen first
    api.subscribe_to_transactions(bank_account)
    api.refresh_balance(bank_account) if refresh_balance

    # Wait for 60 seconds
    sleep(60)

    external_transactions = api.get_transactions(bank_account)

    if external_transactions.present?
      external_transactions.each do | external_transaction |
        bank_transaction = bank_account.bank_transactions.where(company_id: bank_account.company_id, external_stripe_id: external_transaction.id).first_or_initialize
        bank_transaction.external_status = external_transaction.status
        bank_transaction.external_updated_at = Time.at(external_transaction.updated)
        bank_transaction.external_refresh_id = external_transaction.transaction_refresh
        bank_transaction.description = external_transaction.description
        bank_transaction.amount = external_transaction.amount / 100.0
        bank_transaction.transacted_at = Time.at(external_transaction.transacted_at)

        bank_transaction.save
      end
    end

    # Try to update balance
    if refresh_balance
      balance_data = api.get_balance(bank_account)

      if balance_data[:balance].present?
        bank_account.balance = balance_data[:balance]
        bank_account.balance_refreshed_at = balance_data[:balance_refreshed_at]
      end
    else
      bank_account.transactions_refreshed_at = Time.now
    end

    bank_account.update_unconfirmed_transactions
    bank_account.save
  end

  private

  def self.log(str)
    puts str
  end
end