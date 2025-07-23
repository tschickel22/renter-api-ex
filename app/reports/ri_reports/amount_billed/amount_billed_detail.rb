class RiReports::AmountBilled::AmountBilledDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      property: {},
      resident: {label: 'Name', drill_down: :link_to_lease_show},
      unit: {label: 'Address', data_type: :integer_or_string},
      charge_type: {},
      transaction_at: {label: 'Due Date', data_type: :date},
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
        convert_tz(ledger_items.transaction_at, 'UTC', 'US/Mountain') transaction_at,
        charge_types.name charge_type,
        ledger_items.amount,
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
        ledger_items
      ON
        ledger_items.lease_id = leases.id
      JOIN
        charges
      ON
        ledger_items.related_object_id = charges.id
      JOIN
        charge_types
      ON
        charge_types.id = charges.charge_type_id
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
        ledger_items.deleted_at IS NULL AND
        ledger_items.related_object_type = 'Charge' AND
        ledger_items.transaction_at between convert_tz(:start_date, 'US/Mountain', 'UTC') and convert_tz(:end_date, 'US/Mountain', 'UTC')
      ORDER BY
        ledger_items.transaction_at
"

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end
end