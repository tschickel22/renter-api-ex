class RiReports::Deposits::DepositDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading 
    "Detail" 
  end

  def initialize(args)
    super(args.merge({hide_group_header: true}))
  end

  def configure_columns
    {
      payout_on: {label: 'Date', data_type: :date},
      payment_external_id: {label: 'Trans #'},
      account_number: {label: 'Bank Account'},
      resident: {},
      property: {},
      unit: {data_type: :integer_or_string},
      initiated_on: {data_type: :date, label: 'Initiated Date'},
      payment_type: {label: 'Type'},
      bill_type: {},
      amount: {data_type: :currency}
    }
  end

  def configure_row_groups
    {dummy: :dummy, deposit_id: :deposit_id}
  end
 
  def configure_query
    payments_sql = "
      SELECT
        concat('Deposit #',deposits.id) as deposit_id,
        deposits.account_number,
        deposit_items.payout_on,
        deposit_items.external_id as payment_external_id,
        properties.name property,
        concat(residents.first_name, ' ', residents.last_name) resident,
        deposit_items.payment_type,
        deposit_items.bill_type,
        deposit_items.amount,
        deposit_items.initiated_on,
        CASE WHEN length(units.unit_number) > 0 THEN units.unit_number ELSE units.street END unit
      FROM
        companies
      JOIN
        properties
      ON
        properties.company_id = companies.id
      JOIN
        deposits
      ON
        deposits.company_id = companies.id
      JOIN
        deposit_items
      ON
        deposit_items.deposit_id = deposits.id
      JOIN
        payments
      ON
        payments.property_id = properties.id AND
        deposit_items.payment_id = payments.id
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
        deposit_items.payout_on BETWEEN :start_date and :end_date
      "

    payments_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    payments_sql = inject_security_and_hierarchy(payments_sql)

    payment_returns_sql = "
      SELECT
        concat('Deposit #',deposits.id) as deposit_id,
        deposits.account_number,
        DATE(CONVERT_TZ(payment_returns.payment_at, 'UTC', 'US/Mountain')) payout_on,
        deposit_items.external_id as payment_external_id,
        properties.name property,
        concat(residents.first_name, ' ', residents.last_name) resident,
        concat(deposit_items.payment_type, ' - Return') as payment_type,
        deposit_items.bill_type,
        -1 * payment_returns.amount as amount,
        DATE(CONVERT_TZ(payment_returns.payment_at, 'UTC', 'US/Mountain')) as initiated_on,
        CASE WHEN length(units.unit_number) > 0 THEN units.unit_number ELSE units.street END unit
      FROM
        companies
      JOIN
        properties
      ON
        properties.company_id = companies.id
      JOIN
        deposits
      ON
        deposits.company_id = companies.id
      JOIN
        deposit_items
      ON
        deposit_items.deposit_id = deposits.id
      JOIN
        payments
      ON
        payments.property_id = properties.id AND
        deposit_items.payment_id = payments.id
      JOIN
        payment_returns
      ON
        payment_returns.payment_id = payments.id
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
        DATE(CONVERT_TZ(payment_returns.payment_at, 'UTC', 'US/Mountain')) BETWEEN :start_date and :end_date
      "

    payment_returns_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    payment_returns_sql = inject_security_and_hierarchy(payment_returns_sql)

    self.sql = payments_sql + " UNION ALL " + payment_returns_sql
  end
end