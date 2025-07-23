class RiReports::AmountReceived::AmountReceivedDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      property: {},
      resident: {label: 'Name', drill_down: :link_to_lease_show},
      unit: {label: 'Address', data_type: :integer_or_string},
      payment_method: {},
      payment_status: {label: 'Status'},
      payment_at: {label: 'Received Date', data_type: :date},
      amount: {data_type: :currency}
    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end
 
  def configure_query
    self.sql = "
      SELECT
        properties.name property,
        concat(residents.first_name, ' ', residents.last_name) resident,
        CONCAT(units.street, CASE WHEN length(units.unit_number) > 0 THEN CONCAT(' #', units.unit_number) ELSE '' END) unit,
        payments.payment_at,
        payments.extra_info,
        #{payment_method_pretty_and_last_four_sql()} payment_method,
        payments.amount,
        #{payment_status_pretty_sql()} payment_status,
        CONCAT('/leases/', leases.hash_id, '/ledger') link_to_lease_show
      FROM
        companies
      JOIN
        properties
      ON
        properties.company_id = companies.id
      JOIN
        leases
      ON
        properties.id = leases.property_id
      JOIN
        payments
      ON
        payments.lease_id = leases.id
      LEFT OUTER JOIN
        payment_methods
      ON
        payment_methods.id = payments.payment_method_id
      JOIN
        units
      ON
        leases.unit_id = units.id
      JOIN
        lease_residents
      ON
        lease_residents.lease_id = leases.id AND
        lease_residents.type = '#{LeaseResidentPrimary.to_s}'
      JOIN
        residents
      ON
        residents.id = lease_residents.resident_id
      WHERE
        leases.deleted_at IS NULL AND
        convert_tz(payments.payment_at, 'UTC', 'US/Mountain') BETWEEN :start_date and :end_date
"

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

    self.sql += "       ORDER BY payments.payment_at "
  end
end