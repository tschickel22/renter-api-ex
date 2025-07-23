class Api::TaxReportingController < Api::ApiController
  include ApplicationHelper
  skip_before_action :verify_authenticity_token, only: [:upload_attachments]

  def model_class
    TaxReporting
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(_tax_reportings)
    # Load all vendors and property owners marked as Generate 1099
    if params[:report_year].blank? || params[:report_year].to_i == TaxReporting.current_report_year()
      vendors = Vendor.for_user(current_user).where(generate_1099: true)
      property_owners = PropertyOwner.for_user(current_user).where(generate_1099: true)

      payees = vendors + property_owners

      payees = payees.sort_by{|o| o.name}

      payees.map do | payee |
        TaxReporting.ensure_record(current_user, payee)
      end
    end

    tax_reportings = TaxReporting.for_user(current_user).where(report_year: params[:report_year])

    if !params[:search_text].blank?
      # We have to do this manually... yuck!
      tax_reportings = tax_reportings.filter do |tax_reporting|
        tax_reporting.related_object&.name&.downcase.include?(params[:search_text].downcase)
      end
    end

    return tax_reportings
  end

  def perform_searchers(tax_reportings)
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


  def submit
    tax_reportings = TaxReporting.for_user(current_user).where(id: params[:tax_reporting_ids])

    api = RenterInsightNelcoApi.new(current_user.company)

    errors = []

    result = api.transmit(tax_reportings)

    tax_reportings.each do | tax_reporting |
      if result.is_a?(Hash) && result[:status] == "succeeded"
        tax_reporting.status = TaxReporting::STATUS_SUBMITTED
      else
        tax_reporting.status = TaxReporting::STATUS_ERROR
        errors << result[:message]
      end

      tax_reporting.external_url = result[:redirect_url]
      tax_reporting.save
    end

    render_json({tax_reportings: tax_reportings, errors: errors.compact.uniq})

  end

  protected

  def object_params
    params.require(:announcement).permit(Announcement.public_fields + [:attachments_batch_number, mediums: []])
  end

end