class RiReports::ExpensePayments::ExpensePaymentsDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading 
    ""
  end

  def configure_columns
    {
      description: {label: 'Description'},
      vendor: {},
      property: {},
      amount: {data_type: :currency},
      due_on: {data_type: :date, label: 'Due date'},
      payment_at: {data_type: :date, label: 'Paid date'},
      expense_payment_status: {},
      account: {label: "Account"},
      extra_info: {label: "Check #", data_type: :integer},
      void: {label: '', drill_down: :link_to_void_payment}

    }
  end
 
  def configure_query
    self.sql = "
      SELECT
        expenses.description,
        convert_tz(payments.payment_at, 'UTC', 'US/Mountain') payment_at,
        vendors.name vendor,
        payments.amount,
        expenses.due_on,
        accounts.name account,
        'Void Payment' as void,
        concat('/bills/payments/', payments.hash_id,'/void') as link_to_void_payment,
        CASE WHEN expense_property_splits.property_ids like '%,%' THEN 'Multiple' ELSE properties.name END property,
        CASE
          WHEN payments.expense_payment_status = '#{ExpensePayment::STATUS_PAPER_CHECK_MANUAL}' THEN 'Handwritten Check'
          WHEN payments.expense_payment_status = '#{ExpensePayment::STATUS_PAPER_CHECK_PRINTED}' THEN 'Printed Check'
          WHEN payments.expense_payment_status = '#{ExpensePayment::STATUS_ACH}' THEN 'ACH'
          WHEN payments.expense_payment_status = '#{ExpensePayment::STATUS_CREDIT_CARD}'THEN 'Credit Card'
          WHEN payments.expense_payment_status = '#{ExpensePayment::STATUS_CASH}'THEN 'Cash'
          ELSE payments.expense_payment_status
        END expense_payment_status,
        payments.extra_info
      FROM
        companies
      JOIN
        expenses
      ON
        expenses.company_id = companies.id
      JOIN
        (SELECT group_concat(property_id) property_ids, expense_id FROM expense_property_splits GROUP BY expense_property_splits.expense_id) expense_property_splits
      ON
        expense_property_splits.expense_id = expenses.id
      LEFT OUTER JOIN
        properties
      ON
        expense_property_splits.property_ids = properties.id
      JOIN
        vendors
      ON
        expenses.vendor_id = vendors.id
      JOIN
        payments
      ON
        payments.expense_id = expenses.id AND
        payments.type='#{ExpensePayment}'
      LEFT OUTER JOIN
        accounts
      ON
        payments.from_account_id = accounts.id
      WHERE
        payments.status in ('#{Payment::STATUS_SUCCEEDED}', '#{Payment::STATUS_MANUAL}') AND
        payments.expense_payment_status != '#{ExpensePayment::STATUS_PAPER_CHECK_QUEUED}' AND
        expenses.deleted_at IS NULL AND
        convert_tz(payment_at, 'UTC', 'US/Mountain') BETWEEN :start_date and :end_date
      "
    # Prop
    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end
end