class EfsReports::CriteriaAccountReconciliation < EfsReports::EfsReportCriteria
  def self.criteria_id
    'account_reconciliation_id'
  end

  def self.current(params)
    if !params[EfsReports::CriteriaAccountReconciliation.criteria_id].blank?
      params[EfsReports::CriteriaAccountReconciliation.criteria_id]
    else
      '-1'
    end
  end

  def self.where_sql(account_reconciliation_id)
    if !account_reconciliation_id.blank?
      " AND account_reconciliations.hash_id = '#{account_reconciliation_id}' "
    else
      ""
    end
  end

  def validate(params)
    if params[EfsReports::CriteriaAccountReconciliation.criteria_id].blank?
      @report.criteria_errors << 'Select a reconciliation'
      return false
    end

    return true
  end

  def header_items(_for_pdf = false, _for_subscription_description = false)

    account_reconciliation = AccountReconciliation.for_user(@report.current_user).where(hash_id: @report.params[EfsReports::CriteriaAccountReconciliation.criteria_id].to_i).first

    if account_reconciliation.present?
      return ["#{account_reconciliation.bank_account.name} / #{account_reconciliation.end_on.strftime('%m/%d/%Y')}"]
    else
      return ["No Account Selected"]
    end

  end
end