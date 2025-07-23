class Bill < Expense

  validates :due_on, presence: true

  def self.create_for_deposit_refund(ledger_item)
    lease = ledger_item.lease
    lease_resident = lease.primary_resident

    bank_account = BankAccount.find_bank_account_for_refund(lease)

    if bank_account.nil?
      Rails.logger.error("COULD NOT CREATE REFUND EXPENSE - bank account not found for Lease ##{lease.id}")
      return nil
    else
      expense = Bill.new(company_id: lease.company_id)
      vendor = Vendor.where(company_id: lease.company_id, name: lease_resident.resident.full_name).first_or_create

      # Send the check to the Resident's Forwarding Address
      vendor.street = lease_resident.forwarding_street
      vendor.city = lease_resident.forwarding_city
      vendor.state = lease_resident.forwarding_state
      vendor.zip = lease_resident.forwarding_zip
      vendor.save

      expense.due_on = PaymentService.todays_date()
      expense.paid_on = PaymentService.todays_date()
      expense.description = "Refund for #{lease_resident.resident.full_name}"
      expense.amount = ledger_item.amount
      expense.vendor = vendor
      expense.payment_account_id = bank_account.account_id

      # Deposit Account - figure out where this money is headed
      deposit_account = Account.where(company_id: ledger_item.company_id, code: ledger_item.related_object.charge_type.account_code).first
      expense.expense_account_splits << ExpenseAccountSplit.new(account: deposit_account, amount: ledger_item.amount)
      expense.expense_property_splits << ExpensePropertySplit.new(company_id: lease.company_id, property_id: lease.property_id, unit_id: lease.unit_id, amount: ledger_item.amount)

      if !expense.save
        raise "Could not save deposit refund expense: #{expense.errors.full_messages.join(", ")}"
      end

      return expense
    end
  end

  def destroy
    # We cannot delete a bill with printed checks
    if PrintedCheck.where(related_object: self.expense_payments, status: PrintedCheck::STATUS_PRINTED).exists?
      errors.add(:base, "Cannot delete a bill with printed checks")
      return false
    end

    # Remove all queued payments
    PrintedCheck.where(related_object: self.expense_payments, status: PrintedCheck::STATUS_QUEUED).each do | printed_check |
      printed_check.destroy
    end

    super
  end
end

