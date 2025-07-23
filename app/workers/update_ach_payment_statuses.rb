class UpdateAchPaymentStatuses

  DAYS_TO_PULL = 90

  # This is for PayLease only
  def self.perform(external_id = nil)
    log("--- Starting #{self.to_s} external_id:#{external_id} ---")

    # Pull up all ACH payments made in the past N days and call PayLease to see if everything has succeeded
    payments = ResidentPayment.where(api_partner_id: RenterInsightZegoApi::API_PARTNER_ID, status: [Payment::STATUS_SUCCEEDED, Payment::STATUS_PENDING]).where.not(external_id: nil)

    if external_id.present?
      payments = payments.where(external_id: external_id)
    else
      payments = payments.joins(:payment_method).where("payment_at > date_sub(now(), interval #{DAYS_TO_PULL} day)").where(payment_method: {method: PaymentMethod::METHOD_ACH})
    end

    payments.each do | payment |
      if payment.payment_return.nil?
        UpdateAchPaymentStatuses.pull_payment_update_from_zego(payment)
      end
    end

    if external_id.nil?

      # Grab any recently-returned ACH payments and log return codes
      companies = Company.where(payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_COMPLETED).to_a
      companies.each do | company |
        zego_processor = RenterInsightZegoApi.new(company)
        results = zego_processor.ach_returns(Date.yesterday, Date.today, nil)

        if results.present?
          results.deep_symbolize_keys!

          transactions = ApiProcessor.read_xml_array(results, 'Transactions/Transaction/Transactions/Transaction')

          transactions.each do | transaction |
            if !transaction[:TransactionId].blank?
              payment = ResidentPayment.where(api_partner_id: RenterInsightZegoApi::API_PARTNER_ID, external_id: transaction[:TransactionId]).first

              if payment.present?
                if payment.payment_return.present?
                  payment_return = payment.payment_return

                  # Stash the return code and return reason
                  updates = {}
                  updates[:return_code] = transaction[:ReturnCode].first if !transaction[:ReturnCode].empty? && !transaction[:ReturnCode].first.blank?
                  updates[:return_reason] = transaction[:ReturnStatus].first if !transaction[:ReturnStatus].empty? && !transaction[:ReturnStatus].first.blank?

                  payment_return.update(updates) if !updates.empty?

                else
                  log("Return reported but not yet logged Payment #{payment.id} Zego Transaction ##{transaction[:TransactionId]}")
                end
              else
                log("Return reported for unknown Zego Transaction ##{transaction[:TransactionId]}")
              end
            end
          end
        end
      end

      # Finally, update deposit information
      companies = Company.where(payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_COMPLETED).to_a
      companies.each do | company |
        zego_processor = RenterInsightZegoApi.new(company)
        results = zego_processor.deposit_by_date_range(Date.today - 6.days, Date.today)

        if results.present?
          results.deep_symbolize_keys!

          external_deposits = ApiProcessor.read_xml_array(results, 'Transactions/Transaction/Deposits/Deposit')

          # Combine deposits by account & day
          combined_external_deposits = Hash.new

          external_deposits.each do | external_deposit |

            payee_id = ApiProcessor.read_xml_string(external_deposit, 'PayeeId')
            account_number = ApiProcessor.read_xml_string(external_deposit, 'AccountNumber')
            deposit_date = Date.strptime(ApiProcessor.read_xml_string(external_deposit, 'DepositDate'), '%m/%d/%Y')

            deposit = Deposit.where(company_id: company.id, api_partner_id: RenterInsightZegoApi::API_PARTNER_ID, external_id: payee_id, account_number: account_number, deposit_on: deposit_date).first_or_create

            key = "#{payee_id}:#{account_number}:#{deposit_date}"

            # Have we already seen this deposit today? If not, clean house
            if combined_external_deposits[key].nil?
              combined_external_deposits[key] = deposit

              deposit.deposit_items.each{|di| di.destroy}
              deposit.amount = 0
              deposit.transaction_count = 0
            end

            deposit.bank_account = BankAccount.where(company_id: company.id, external_id: payee_id).first if deposit.bank_account_id.nil? && !payee_id.blank?
            deposit.amount += ApiProcessor.read_xml_number(external_deposit, "DepositAmount")
            deposit.transaction_count += ApiProcessor.read_xml_integer(external_deposit, "TotalTransactions")
            deposit.save

            if !external_deposit[:TransactionsDetail].empty?
              transactions = ApiProcessor.read_xml_array(external_deposit, "TransactionsDetail/TransactionDetail")

              transactions.each do | transaction |
                deposit_item = DepositItem.new(deposit: deposit, company_id: company.id)
                deposit_item.external_id = ApiProcessor.read_xml_string(transaction, 'TransactionId')
                deposit_item.initiated_on = transaction[:InitiatedDate].present? ? Date.strptime(ApiProcessor.read_xml_string(transaction, 'InitiatedDate'), '%m/%d/%Y') : nil
                deposit_item.payout_on = transaction[:PayoutDate].present? ? Date.strptime(ApiProcessor.read_xml_string(transaction, 'PayoutDate'), '%m/%d/%Y') : nil
                deposit_item.payment_type = ApiProcessor.read_xml_string(transaction, 'PaymentType')
                deposit_item.bill_type = ApiProcessor.read_xml_string(transaction, 'BillType')
                deposit_item.external_reference_id = ApiProcessor.read_xml_string(transaction, 'PaymentReferenceId')
                deposit_item.amount = ApiProcessor.read_xml_number(transaction, "Amount")

                if !deposit_item.external_id.blank?
                  deposit_item.payment = ResidentPayment.where(api_partner_id: RenterInsightZegoApi::API_PARTNER_ID, external_id: deposit_item.external_id).first
                end

                deposit_item.save
              end
            end
          end
        end
      end

    end

    log("--- Stopping #{self.to_s} ---")
  end

  def self.pull_payment_update_from_zego(payment)
    log("Checking ##{payment.id} ZegoID: #{payment.external_id}")

    # Call PayLease, find out the current status
    zego_processor = RenterInsightZegoApi.new(payment.company)

    zego_processor.transaction_details(payment, nil)
    code = zego_processor.read_transaction_code()

    if code.present? && [RenterInsightZegoApi::CODE_RETURNED, RenterInsightZegoApi::CODE_CANCELLED].include?(code.to_i) && !PaymentReturn.where(payment_id: payment.id).exists?
      payment_return = PaymentReturn.return_amount(payment, payment.amount, zego_processor.read_transaction_message)

      if payment_return.present?

        ResidentMailer.payment_return_receipt(payment_return.id).deliver

        return payment_return
      else
        log("Could not return payment ##{payment.id}")
      end
    end
    return nil
  end

  private

  def self.log(str)
    puts str
  end
end