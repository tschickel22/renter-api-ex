class RiReports::Expenses::ExpenseDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading 
    ""
  end

  def configure_columns
    {
      description: {drill_down: :link_to_edit_expense},
      vendor: {},
      property: {},
      account: {label: 'Category'},
      due_on: {data_type: :date, label: 'Date of Expense'},
      payment_account: {},
      amount: {data_type: :currency},
    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end

  def configure_query
    self.sql = "
      SELECT
        expenses.description,
        vendors.name vendor,
        expenses.amount,
        expenses.due_on,
        CASE WHEN payments.from_account_ids like '%,%' THEN 'Multiple' ELSE payment_accounts.name END payment_account,
        CASE WHEN expense_account_splits.account_ids like '%,%' THEN 'Multiple' ELSE accounts.name END account,
        CASE WHEN expense_property_splits.property_ids like '%,%' THEN 'Multiple' ELSE properties.name END property,
        concat('/expenses/', expenses.hash_id,'/edit') as link_to_edit_expense
      FROM
        companies
      JOIN
        expenses
      ON
        expenses.company_id = companies.id
      JOIN
        (SELECT group_concat(distinct property_id) property_ids, expense_id FROM expense_property_splits GROUP BY expense_property_splits.expense_id) expense_property_splits
      ON
        expense_property_splits.expense_id = expenses.id
      JOIN
        (SELECT group_concat(distinct account_id) account_ids, expense_id FROM expense_account_splits GROUP BY expense_account_splits.expense_id) expense_account_splits
      ON
        expense_account_splits.expense_id = expenses.id
      LEFT OUTER JOIN
        properties
      ON
        expense_property_splits.property_ids = properties.id
      LEFT OUTER JOIN
        accounts
      ON
        expense_account_splits.account_ids = accounts.id
      JOIN
        vendors
      ON
        expenses.vendor_id = vendors.id
      LEFT OUTER JOIN
        (SELECT group_concat(distinct from_account_id) from_account_ids, expense_id FROM payments W~HERE payments.type='#{ExpensePayment}' GROUP BY payments.expense_id) payments
      ON
        payments.expense_id = expenses.id
      LEFT OUTER JOIN
        accounts payment_accounts
      ON
        payments.from_account_ids = payment_accounts.id
      WHERE
        expenses.deleted_at IS NULL AND
        expenses.type = 'Expense' AND
        expenses.due_on BETWEEN :start_date and :end_date
      "
    # Prop
    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end
end