class Api::ExpensePaymentsController < Api::ApiController

  def model_class
    ExpensePayment
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(expense_payments)
    expense_payments = expense_payments.where(expense_payment_status: params[:expense_payment_status])
    check_numbers = {}

    # If we're looking for unprinted checks, fill in the check numbers
    if params[:expense_payment_status] ==  ExpensePayment::STATUS_PAPER_CHECK_QUEUED
      expense_payments.each do | expense_payment |
        if expense_payment.from_account&.bank_account.present? && expense_payment.from_account.primary_bank_account.check_number.present?
          # Keep track of what we've assigned
          check_numbers[expense_payment.from_account.primary_bank_account.id] ||= expense_payment.from_account.primary_bank_account.check_number
          check_numbers[expense_payment.from_account.primary_bank_account.id] += 1

          expense_payment.extra_info = check_numbers[expense_payment.from_account.primary_bank_account.id]
        end
      end
    end

    return expense_payments
  end

  def search
    objects = perform_search(ExpensePayment.for_user(current_user).joins(:expense))
    objects, total = page(objects)

    render_json({ plural_object_key() => objects.collect{|o| o.to_builder("full").attributes! }, total: total  })
  end

  def create_multiple
    all_payments = []
    payments_to_save = []
    all_valid = true

    params[:payments].each do | pp |
      payment_params = parse_number_param(pp.permit(ExpensePayment.public_fields), [:amount])

      payment = ExpensePayment.new(payment_params)

      if !pp[:from_account_id].blank? && pp[:from_account_id] != "false"
        # Find the expense
        expense = Expense.where(hash_id: pp[:expense_hash_id]).first

        payment.need_check_number = [ExpensePayment::STATUS_PAPER_CHECK_MANUAL].include?(payment.expense_payment_status)
        payment.company_id = expense.company_id
        payment.expense_id = expense.id
        payment.status = Payment::STATUS_MANUAL

        if !params[:payment_on].blank?
          payment.payment_at = DateTime.parse(params[:payment_on])
        else
          payment.payment_at = Time.now
        end

        payment_valid = payment.valid?

        all_valid &&= payment_valid
        payments_to_save << payment
      end

      all_payments << payment

    end

    if all_valid
      ActiveRecord::Base.transaction do
        payments_to_save.each do | payment |
          if payment.save

            # Update Balances
            payment.expense.save

            # Push to ledger
            AccountingService.generate_entries_for_expense(payment.expense)

            # Generate check?
            if [ExpensePayment::STATUS_PAPER_CHECK_QUEUED].include?(payment.expense_payment_status)
              PrintedCheck.create_for_expense_payment(payment)
            end
          end
        end
      end

      render_json({ plural_object_key() => payments_to_save })

    else
      render_json({errors: {payments: extract_errors_by_attribute(all_payments)}}, false)
    end
  end

  def void
    load_object_for_update()

    # Reverse the entries
    AccountingService.generate_reverse_entries_for_expense_payment(@object)

    # Update the status
    @object.update({status: Payment::STATUS_FAILED})

    # Revert the printed check
    PrintedCheck.where(related_object: @object).update_all(status: PrintedCheck::STATUS_QUEUED)

    # Update the balance
    @object.expense.save()

    render_json({ singular_object_key() => @object })
  end
end