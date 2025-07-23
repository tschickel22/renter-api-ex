module RiReportingHelper
  protected

  def inject_security_and_hierarchy(sequel)

    addl_where = "  companies.id = #{self.report.current_user.company_id} AND "

    if sequel.include?("properties")
      addl_where += "  IFNULL(properties.status, '#{Property::STATUS_ACTIVE}') = '#{Property::STATUS_ACTIVE}' AND "
    end

    if !self.report.current_user.is_company_admin_at_least?
      if self.report.current_user.is_property_owner?
        addl_where += "  properties.id in (SELECT property_id FROM user_assignments, property_ownerships WHERE property_ownerships.property_owner_id = entity_id AND user_id = #{self.report.current_user.id} AND entity_type = '#{PropertyOwner.to_s}') AND "
      else
        addl_where += "  properties.id in (SELECT entity_id FROM user_assignments WHERE user_id = #{self.report.current_user.id} AND entity_type = '#{Property.to_s}') AND "
      end
    end

    # Drop these injected components into the SQL automatically
    sequel.gsub!('WHERE', 'WHERE '+addl_where)
    sequel.gsub!('W~HERE', 'WHERE')

    return sequel
  end

  def payment_method_pretty_sql()
    " CASE
       WHEN payment_methods.method = '#{PaymentMethod::METHOD_ACH}' THEN 'ACH'
       WHEN payment_methods.method = '#{PaymentMethod::METHOD_CREDIT_CARD}'THEN 'Credit Card'
       WHEN payment_methods.method = '#{PaymentMethod::METHOD_DEBIT_CARD}'THEN 'Debit Card'
       WHEN payment_methods.method = '#{PaymentMethod::METHOD_CASH}' THEN 'Cash Pay'
       ELSE 'Unknown'
     END "
  end

  def payment_method_pretty_and_last_four_sql()
    "CONCAT(#{payment_method_pretty_sql()}, CASE WHEN LENGTH(payment_methods.last_four) > 0 THEN CONCAT(' x', payment_methods.last_four) ELSE '' END)"
  end

  def account_type_pretty_sql()
    " CASE
       WHEN accounts.account_type = '#{Account::TYPE_ASSETS}' THEN 'Assets'
       WHEN accounts.account_type = '#{Account::TYPE_EXPENSES}' THEN 'Expenses'
       WHEN accounts.account_type = '#{Account::TYPE_INCOME}' THEN 'Income'
       WHEN accounts.account_type = '#{Account::TYPE_LIABILITY}' THEN 'Liability'
       WHEN accounts.account_type = '#{Account::TYPE_INCOME}' THEN 'Income'
       WHEN accounts.account_type = '#{Account::TYPE_EQUITY}' THEN 'Equity'
       ELSE accounts.account_type
     END "
  end

  def account_code_pretty_sql()
    "
    CASE
      WHEN accounts.code like '%.00' THEN replace(accounts.code, '.00', '')
      ELSE accounts.code
    END
    "
  end

  def payment_status_pretty_sql()
    " CASE
       WHEN payments.status = '#{Payment::STATUS_NEW}' THEN 'New'
       WHEN payments.status = '#{Payment::STATUS_FAILED}' THEN 'Failed'
       WHEN payments.status = '#{Payment::STATUS_MANUAL}' THEN 'Manually Entered'
       WHEN payments.status = '#{Payment::STATUS_SUBMITTED}' THEN 'Submitted'
       WHEN payments.status = '#{Payment::STATUS_SUCCEEDED}' THEN 'Succeeded'
       ELSE payments.status
     END "
  end

  def recurring_payment_frequency_pretty_sql()
    " CASE
       WHEN lease_residents.recurring_payment_frequency IS NULL OR lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_NONE}' THEN 'Auto-Pay Off'
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY}' THEN 'Monthly'
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY}' THEN 'Bi-Weekly'
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY}' THEN 'Weekly'
       ELSE lease_residents.recurring_payment_frequency
     END "
  end

  def recurring_payment_next_amount_sql()
    " CASE
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY}' THEN ledger_aging.total_due
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY}' THEN ledger_aging.total_due / 2
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY}' THEN ledger_aging.total_due / 4
       ELSE NULL
     END "
  end


  def recurring_payment_next_payment_at_sql()
    " CASE
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_MONTHLY}' THEN LAST_DAY(now()) + interval 1 DAY
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_BI_WEEKLY}' THEN 'Bi-Weekly'
       WHEN lease_residents.recurring_payment_frequency = '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_WEEKLY}' THEN 'Weekly'
       ELSE null
     END "
  end

  def link_to_general_ledger_sql(report)
    "CONCAT('/reports/general_ledger/run?account_id=', accounts.id, '&#{EfsReports::CriteriaAccountingMethod::criteria_id}=#{EfsReports::CriteriaAccountingMethod::current(report.params)}&#{EfsReports::CriteriaProperty::criteria_id}=#{EfsReports::CriteriaProperty::current(report.params)}&start_date=#{(report.params['start_date'] || Date.new(1900, 1, 1)).strftime('%m/%d/%Y')}&end_date=#{report.params['end_date'].strftime('%m/%d/%Y')}') link_to_general_ledger"
  end

end