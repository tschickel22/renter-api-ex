class RiReports::Aging::AgingDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      line_number: {label: 'Line #'},
      property: {},
      resident: {label: 'Name', drill_down: :link_to_lease_show},
      unit: {label: 'Address', data_type: :integer_or_string},
      total_due: {data_type: :currency, label: 'Total'},
      bucket_1: {data_type: :currency, label: '1-30'},
      bucket_2: {data_type: :currency, label: '31-60'},
      bucket_3: {data_type: :currency, label: '61-90'},
      bucket_4: {data_type: :currency, label: '91+'},
      auto_pay: {},
      status: {data_cell_class: "status_cell_class"}
    }
  end
 
  def configure_query
    inner_sql = "
        SELECT
          properties.name property,
          concat(residents.first_name, ' ', residents.last_name) resident,
          CONCAT(units.street, CASE WHEN length(units.unit_number) > 0 THEN CONCAT(' #', units.unit_number) ELSE '' END) unit,
          CASE WHEN lease_residents.recurring_payment_frequency IS NOT NULL AND lease_residents.recurring_payment_frequency != '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_NONE}' THEN CONCAT('Auto Pay - ', #{payment_method_pretty_sql()}) ELSE 'Auto Pay - Off' END auto_pay,
          IFNULL(ledger_aging.total_due, 0) total_due,
          IFNULL(ledger_aging.bucket_1, 0) bucket_1,
          IFNULL(ledger_aging.bucket_2, 0) bucket_2,
          IFNULL(ledger_aging.bucket_3, 0) bucket_3,
          IFNULL(ledger_aging.bucket_4, 0) bucket_4,
          CASE WHEN IFNULL(ledger_aging.total_due_with_grace, 0) > 0  AND  IFNULL(ledger_aging.total_due, 0) > 0 THEN 'Past Due' ELSE 'Current' END status,
          CASE WHEN IFNULL(ledger_aging.total_due_with_grace, 0) > 0  AND  IFNULL(ledger_aging.total_due, 0) > 0 THEN 'data-negative' ELSE 'data-positive' END status_cell_class,
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
        LEFT OUTER JOIN
          ledger_aging
        ON
          ledger_aging.lease_id = leases.id
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
        LEFT OUTER JOIN
          payment_methods
        ON
          lease_residents.recurring_payment_method_id = payment_methods.id
        WHERE
          leases.deleted_at IS NULL AND
          leases.id NOT IN (SELECT id FROM leases WHERE id IN (SELECT previous_lease_id FROM leases WHERE status='#{Lease::STATUS_CURRENT}')) AND
          (ledger_aging.total_due > 0 OR leases.status = '#{Lease::STATUS_CURRENT}') AND
          leases.status IN ('#{Lease::STATUS_CURRENT}', '#{Lease::STATUS_RENEWING}', '#{Lease::STATUS_FORMER}') "

    inner_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    inner_sql = inject_security_and_hierarchy(inner_sql)

    self.sql = "
    SELECT
        ROW_NUMBER() OVER (ORDER BY resident)  as line_number,
        property,
        resident,
        unit,
        auto_pay,
        total_due,
        CASE WHEN total_due = 0 THEN 0 ELSE bucket_1 END bucket_1,
        CASE WHEN total_due = 0 THEN 0 ELSE bucket_2 END bucket_2,
        CASE WHEN total_due = 0 THEN 0 ELSE bucket_3 END bucket_3,
        CASE WHEN total_due = 0 THEN 0 ELSE bucket_4 END bucket_4,
        status,
        status_cell_class,
        link_to_lease_show
      FROM (#{inner_sql}) sub
    "
  end
end