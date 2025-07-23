class RiReports::Transactions::TransactionDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading 
    "Detail" 
  end

  def configure_columns
    {
      payment_external_id: {label: 'Transaction #'},
      status: {data_type: :lookup, replacements: Payment::STATUS_OPTIONS},
      property: {},
      resident: {},
      unit: {data_type: :integer_or_string},
      payment_at: {data_type: :date, label: 'Date'},
      payment_type: {},
      last_four: {},
      amount: {data_type: :currency}
    }
  end
 
  def configure_query
    self.sql = "
      SELECT
        CASE
          WHEN payments.status = '#{Payment::STATUS_MANUAL}' THEN payments.hash_id
          ELSE payments.external_id
        END payment_external_id,
        CASE
          WHEN payments.status = '#{Payment::STATUS_MANUAL}' THEN '#{Payment::STATUS_SUCCEEDED}'
          ELSE payments.status
        END status,
        properties.name property,
        convert_tz(payments.payment_at, 'UTC', 'US/Mountain') payment_at,
        concat(residents.first_name, ' ', residents.last_name) resident,
        payments.amount,
        CASE WHEN length(units.unit_number) > 0 THEN units.unit_number ELSE units.street END unit,
        CASE
          WHEN payments.status = '#{Payment::STATUS_MANUAL}' THEN 'Paper Check'
          WHEN payment_methods.method = '#{PaymentMethod::METHOD_ACH}' THEN 'ACH'
          WHEN payment_methods.method = '#{PaymentMethod::METHOD_CREDIT_CARD}'THEN 'Credit Card'
          WHEN payment_methods.method = '#{PaymentMethod::METHOD_DEBIT_CARD}'THEN 'Debit Card'
          WHEN payment_methods.method = '#{PaymentMethod::METHOD_CASH}' THEN 'Cash Pay'
          ELSE payment_methods.method
        END payment_type,
        CASE
          WHEN payments.status = '#{Payment::STATUS_MANUAL}' THEN payments.extra_info
          ELSE payment_methods.last_four
        END last_four

      FROM
        companies
      JOIN
        properties
      ON
        properties.company_id = companies.id
      JOIN
        payments
      ON
        payments.property_id = properties.id AND
        (payments.fee_type IS NULL OR payments.fee_type != 'screening_fee')
      LEFT OUTER JOIN
        payment_methods
      ON
        payments.payment_method_id = payment_methods.id
      JOIN
        leases
      ON
        payments.lease_id = leases.id
      JOIN
        units
      ON
        leases.unit_id = units.id
      LEFT OUTER JOIN
        lease_residents
      ON
        lease_residents.lease_id = leases.id AND
        lease_residents.type = '#{LeaseResidentPrimary.to_s}'
      LEFT OUTER JOIN
        residents
      ON
        residents.id = IFNULL(payments.resident_id, lease_residents.resident_id)
      WHERE
        payments.status in ('#{Payment::STATUS_SUCCEEDED}', '#{Payment::STATUS_MANUAL}') AND
        convert_tz(payment_at, 'UTC', 'US/Mountain') BETWEEN :start_date and :end_date
      "

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end
end