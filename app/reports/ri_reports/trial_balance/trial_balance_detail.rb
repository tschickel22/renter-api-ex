class RiReports::TrialBalance::TrialBalanceDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      account_code: {label: 'Code'},
      account_name: {label: 'Detail Type', drill_down: :link_to_general_ledger},
      debits: {data_type: :currency},
      credits: {data_type: :currency}

    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end

  def configure_query
    self.sql = "
      SELECT
           accounts.code account_code,
           accounts.name account_name,
           SUM(CASE WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}', '#{Account::TYPE_EXPENSES}') THEN -1 * account_entries.amount ELSE NULL END) debits,
           SUM(CASE WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}', '#{Account::TYPE_EXPENSES}') THEN NULL ELSE account_entries.amount END) credits,
           #{link_to_general_ledger_sql(report)}
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          entry_on BETWEEN :start_date AND :end_date
      GROUP BY
          accounts.code,
          accounts.name
      HAVING
          SUM(account_entries.amount) != 0
"
    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

  end
end