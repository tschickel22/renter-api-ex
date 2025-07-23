class RiReports::RecurringPayments::RecurringPaymentsDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      property: {},
      resident: {label: 'Name', drill_down: :link_to_lease_show},
      unit: {label: 'Address', data_type: :integer_or_string},
      payment_method: {},
      recurring_payment_frequency: {label: 'Frequency'},
      recurring_payment_next_payment_on: {label: 'Next Scheduled Payment', data_type: :date},
      recurring_payment_next_amount: {label: 'Amount Scheduled', data_type: :currency}
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
        CASE WHEN lease_residents.recurring_payment_method_id IS NOT NULL AND lease_residents.recurring_payment_frequency != '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_NONE}' THEN #{payment_method_pretty_and_last_four_sql()}  ELSE NULL END payment_method,
        #{recurring_payment_frequency_pretty_sql()} recurring_payment_frequency,
        #{recurring_payment_next_amount_sql()} recurring_payment_next_amount,
        CASE WHEN lease_residents.recurring_payment_method_id IS NOT NULL AND lease_residents.recurring_payment_frequency != '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_NONE}' THEN lease_residents.recurring_payment_next_payment_on  ELSE NULL END recurring_payment_next_payment_on,
        CONCAT('/leases/', leases.hash_id) link_to_lease_show
      FROM
        companies
      JOIN
        properties
      ON
        properties.company_id = companies.id
      JOIN
        leases
      ON
        properties.id = leases.property_id AND
        leases.status = '#{Lease::STATUS_CURRENT}'
      JOIN
        lease_residents
      ON
        lease_residents.lease_id = leases.id AND
        lease_residents.type = '#{LeaseResidentPrimary.to_s}'
      LEFT OUTER JOIN
        payment_methods
      ON
        payment_methods.id = lease_residents.recurring_payment_method_id
      JOIN
        units
      ON
        leases.unit_id = units.id
      JOIN
        residents
      ON
        residents.id = lease_residents.resident_id
      JOIN
        ledger_aging
      ON
        ledger_aging.lease_id = leases.id
      WHERE
        leases.deleted_at IS NULL
"

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

  end
end