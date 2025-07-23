class Api::PrintedChecksController < Api::ApiController

  def model_class
    PrintedCheck
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(printed_checks)
    printed_checks = printed_checks.where(status: params[:status])
    check_numbers = {}

    # If we're looking for unprinted checks, fill in the check numbers
    if params[:status] ==  PrintedCheck::STATUS_QUEUED
      printed_checks.each do | printed_check |
        if printed_check.bank_account.present? && printed_check.bank_account.check_number.present?
          # Keep track of what we've assigned
          check_numbers[printed_check.bank_account.id] ||= printed_check.bank_account.check_number
          check_numbers[printed_check.bank_account.id] += 1

          printed_check.check_number = check_numbers[printed_check.bank_account.id]
        end
      end
    end

    return printed_checks
  end

  def search
    objects = perform_search(PrintedCheck.for_user(current_user))
    objects, total = page(objects)

    render_json({ plural_object_key() => objects.collect{|o| o.to_builder("full").attributes! }, total: total  })
  end

  def update_unprinted_checks
    all_checks = []
    checks_to_print = []
    all_valid = true

    params[:printed_checks].each do | pp |
      printed_check_params = pp.permit(PrintedCheck.public_fields + [:hash_id])

      printed_check = PrintedCheck.where(hash_id: printed_check_params[:hash_id]).first

      if pp[:status]
        printed_check.need_check_number = true
        printed_check.check_number = pp[:check_number]
        printed_check.printed_on = PaymentService.todays_date()

        check_valid = printed_check.valid?

        all_valid &&= check_valid

        checks_to_print << printed_check
      end

      all_checks << printed_check

    end

    if all_valid && !checks_to_print.empty?

      checks_pdf = CheckPrintingService.generate_checks(checks_to_print)
      filename = "/export/checks-#{Time.now.strftime('%Y%m%d%H%M%S')}-#{checks_to_print.first.hash_id}.pdf"
      File.open("#{Rails.root}#{filename}", "wb") { |f| f.write(checks_pdf.to_pdf) }

      ActiveRecord::Base.transaction do
        checks_to_print.each do | printed_check |

          # Mark as printed
          printed_check.status = PrintedCheck::STATUS_PRINTED

          if printed_check.save

            # Update Balances
            if printed_check.related_object.is_a?(ExpensePayment)
              printed_check.related_object.update({ expense_payment_status: ExpensePayment::STATUS_PAPER_CHECK_PRINTED, extra_info: printed_check.check_number })
              printed_check.related_object.expense.save

            # Update ledger description
            elsif printed_check.related_object.is_a?(ResidentLedgerItem)
              printed_check.related_object.related_object.update(description: "Refund by check ##{printed_check.check_number}")
            end

            # Update bank account check numbers
            if printed_check.check_number && printed_check.bank_account.present?
              printed_check.bank_account.update(check_number: printed_check.check_number)
            end

            # Push to ledger
            if printed_check.related_object.is_a?(ExpensePayment)
              AccountingService.generate_entries_for_expense(printed_check.related_object.expense)
            elsif printed_check.related_object.is_a?(ResidentLedgerItem)
              AccountingService.generate_entries_for_refunded_deposit(printed_check)
            end
          end
        end
      end

      render_json({ redirect: filename })

    else
      render_json({errors: {printed_checks: extract_errors_by_attribute(all_checks)}}, false)
    end
  end

  def delete_unprinted_checks

    deleted_count = 0
    checks_to_delete = []
    bank_accounts_to_update = []

    params[:printed_checks].each do | pp |
      printed_check_params = pp.permit(PrintedCheck.public_fields + [:hash_id])

      if pp[:status]
        printed_check = PrintedCheck.where(hash_id: printed_check_params[:hash_id]).first

        checks_to_delete << printed_check if printed_check.is_queued?
      end
    end

    if !checks_to_delete.empty?

      ActiveRecord::Base.transaction do
        checks_to_delete.each do | printed_check |
          if printed_check.destroy
            deleted_count += 1
          else
            raise "Unable to delete check"
          end
        end
      end

      render_json({ deleted_count: deleted_count })

    else
      render_json({errors: {base: "Unable to delete all checks"}}, false)
    end
  end

  def reprint_checks
    checks_to_print = []

    params[:printed_checks].each do | pp |
      printed_check_params = pp.permit(PrintedCheck.public_fields + [:hash_id])

      printed_check = PrintedCheck.where(hash_id: printed_check_params[:hash_id]).first

      if !pp[:status].blank?
        checks_to_print << printed_check
      end
    end

    checks_pdf = CheckPrintingService.generate_checks(checks_to_print)
    filename = "/export/reprinted-checks-#{Time.now.strftime('%Y%m%d%H%M%S')}-#{checks_to_print.first.hash_id}.pdf"
    File.open("#{Rails.root}#{filename}", "wb") { |f| f.write(checks_pdf.to_pdf) }

    render_json({ redirect: filename })

  end
end