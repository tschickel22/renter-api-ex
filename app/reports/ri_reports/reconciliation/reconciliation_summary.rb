class RiReports::Reconciliation::ReconciliationSummary < EfsReports::DataListSection
  include RiReportingHelper

  def heading
    "Summary"
  end

  def configure_columns
    {
      beginning_balance: {label: "Statement beginning balance", data_type: :currency},
      credit_amount: {label: "Charges and cash advances cleared ({credit_count})", data_type: :currency},
      debit_amount: {label: "Payments and credits cleared ({debit_count})", data_type: :currency},
      ending_balance: {label: "Statement ending balance", data_type: :currency},
      dummy: {label: ""},
      uncleared: {label: "Uncleared transactions as of {end_on}", data_type: :currency},
      ending_balance_plus_uncleared: {label: "Register balance as of {end_on}", data_type: :currency},

      end_on: {hidden: true, data_type: :date},
      credit_count: {hidden: true},
      debit_count: {hidden: true},
    }
  end
 
  def configure_query
    self.sql = "
      SELECT
        account_reconciliations.begin_on,
        account_reconciliations.end_on,
        account_reconciliations.beginning_balance,
        account_reconciliations.ending_balance,
        account_reconciliations.debit_amount,
        account_reconciliations.credit_amount,
        account_reconciliations.debit_count,
        account_reconciliations.credit_count,
        uncleared_subquery.uncleared_amount as uncleared,
        account_reconciliations.ending_balance + uncleared_subquery.uncleared_amount as ending_balance_plus_uncleared
      FROM
         account_reconciliations
      JOIN
         companies
      ON
        account_reconciliations.company_id = companies.id
      JOIN
        (SELECT SUM(amount) uncleared_amount FROM (#{build_uncleared_subquery}) uncleared_subquery) as uncleared_subquery
      WHERE
        1=1
    "

    self.sql += EfsReports::CriteriaAccountReconciliation.where_sql(report.params[EfsReports::CriteriaAccountReconciliation::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end

  def build_uncleared_subquery
    section = RiReports::Reconciliation::ReconciliationDetailUncleared.new(user: report.current_user, real_user: report.current_user, report: self.report, section_id: 'uncleared_subquery')
    section.configure_query()

    return section.sql
  end
end