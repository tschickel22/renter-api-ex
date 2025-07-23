class EfsReports::CriteriaAccountingMethod < EfsReports::EfsReportCriteria
  def self.criteria_id
    'accounting_method'
  end

  def self.current(params)
    if !params[EfsReports::CriteriaAccountingMethod.criteria_id].blank?
      params[EfsReports::CriteriaAccountingMethod.criteria_id]
    else
      'cash'
    end
  end

  def self.where_sql(accounting_method)
    if !accounting_method.blank? && accounting_method == "accrual"
      "accrual_account_id"
    else
      "cash_account_id"
    end
  end

  def validate(params)
    return true
  end

  def header_items(_for_pdf = false, for_subscription_description = false)
    if @report.params[EfsReports::CriteriaAccountingMethod.criteria_id].blank? || @report.params[EfsReports::CriteriaAccountingMethod.criteria_id] == "cash"
      return ["Cash"]
    else
      return ["Accrual"]
    end
  end
end