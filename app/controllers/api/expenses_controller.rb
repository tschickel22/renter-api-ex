class Api::ExpensesController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_receipts]

  def model_class
    Expense
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(expenses)
    expenses = expenses.includes(:vendor, expense_property_splits: [:company, :property, :unit], expense_account_splits: :account)

    if !params[:search_text].blank?
      expenses = expenses.joins(:vendor).left_outer_joins(expense_property_splits: :property, expense_account_splits: :account).where(["expenses.hash_id like :search_text or expenses.description like :search_text or vendors.name like :search_text or properties.name like :search_text or accounts.name like :search_text or expenses.amount like :search_text", {search_text: "%#{params[:search_text]}%"}])
    end

    if !params[:start_date].blank? && !params[:end_date].blank?
      expenses = expenses.where("(due_on BETWEEN :start_date AND :end_date) OR (paid_on BETWEEN :start_date AND :end_date)", {start_date: params[:start_date], end_date: params[:end_date]})
    end

    if params[:type] == Bill.to_s
      expenses = expenses.bills.unpaid
    else
      expenses = expenses.expenses
    end

    if !params[:property_id].blank?
      expenses = expenses.joins(:expense_property_splits).where(expense_property_splits: {property_id: params[:property_id]})
    end

    return expenses.uniq
  end

  def show
    if ["new_expense"].include?(params[:id])

      @object = setup_new_object
      @object.expense_account_splits = [ExpenseAccountSplit.new]
      @object.expense_property_splits = [ExpensePropertySplit.new(company_id: current_user.company_id)]

      render_successful_update
    else
      super
    end
  end

  def handle_after_create

    # Move over any unattached photos
    if @object.receipts_batch_number.present?
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: @object.receipts_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = Expense.to_s
          f.record_id = @object.id
          f.name = "receipts"
          f.save
        end
      end
    end

    push_to_ledger()

    # Was this a bank transaction? If so, update its related object
    if !params[:expense][:bank_transaction_id].blank?
      BankTransaction.for_user(current_user).where(id: params[:expense][:bank_transaction_id]).first&.update(related_object: @object)
    end
  end

  def handle_after_update
    push_to_ledger()
  end

  def push_to_ledger

    # Make sure all expenses
    if @object.is_expense?
      @object.ensure_expense_payment()
    end

    AccountingService.generate_entries_for_expense(@object)
  end

  def destroy
    load_object_for_update

    if @object.present? && @object.destroy
      render_successful_update()
    else
      render_failed_update
    end
  end

  def receipts
    load_object_for_update()
    render_receipts_json()
  end

  def destroy_receipt
    load_object_for_update()
    @object.receipts.where(id: params[:receipt_id]).purge
    render_receipts_json()
  end

  def upload_receipts
    file_params = params.permit(:id, :receipt, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: Expense.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:receipt])
      unattached_file_batch.save

      receipts = unattached_file_batch.files.collect{|ip| Expense.receipt_builder(ip).attributes!}
      render_json({ receipts: receipts  })
    else
      load_object_for_update()

      if @object.present?
        @object.receipts.attach(params.permit(:receipt)[:receipt])

        if @object.save
          render_receipts_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["Expense not found"]}, false)
      end
    end
  end

  protected

  def object_params
    op = parse_number_param(params.require(:expense).permit(Expense.public_fields + [:receipts_batch_number] + [expense_account_splits: [ExpenseAccountSplit.public_fields + [:_destroy]], expense_property_splits: [ExpensePropertySplit.public_fields + [:_destroy]]]), [:amount]) || {}

    op[:expense_account_splits_attributes] = op.delete(:expense_account_splits).collect{|eas| parse_number_param(eas, [:amount])} if op[:expense_account_splits].present?

    if op[:expense_property_splits].present?
      op[:expense_property_splits_attributes] = op.delete(:expense_property_splits).collect{|eas| parse_number_param(eas, [:amount])}

      # If only one split was sent, just use the account split amount
      if op[:expense_property_splits_attributes].length == 1
        total_account_split = op[:expense_account_splits_attributes].inject(BigDecimal("0")) {|sum, eas| sum + (BigDecimal(eas[:amount] || "0"))}
        op[:expense_property_splits_attributes][0][:amount] = total_account_split
      end

      # Make sure company_id is set
      op[:expense_property_splits_attributes].each { |epsa| epsa[:company_id] = current_user.company_id}
    end

    return op
  end

  def render_receipts_json
    receipts = @object.receipts.collect{|ip| Expense.receipt_builder(ip).attributes!} if @object.present?
    render_json({ receipts: receipts  })
  end
end