class RiReports::Reconciliation::ReconciliationHeader < EfsReports::DataListSection
  include RiReportingHelper

  def heading
    "Reconciliation Report"
  end

  def footer
    "Any changes made to transactions after this date aren't included in this report."
  end

  def configure_columns
    {
      closed_at: {label: "Reconciled On", data_type: :date},
      email: {label: "Reconciled By"}
    }
  end

  def configure_query
    self.sql = "
      SELECT
        account_reconciliations.closed_at,
        users.email
      FROM
         account_reconciliations
      JOIN
         companies
      ON
        account_reconciliations.company_id = companies.id
      LEFT OUTER JOIN
        users
      ON
        account_reconciliations.closed_by_user_id = users.id
      WHERE
        1=1
    "

    self.sql += EfsReports::CriteriaAccountReconciliation.where_sql(report.params[EfsReports::CriteriaAccountReconciliation::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end
end