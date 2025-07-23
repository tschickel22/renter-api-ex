class RiReports::PropertyOwnerTransactions::PropertyOwnerTransactionDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading 
    ""
  end

  def configure_columns
    {
      name: {label: "Owner", drill_down: :link_to_property_owner_edit},
      property: {label: "Property"},
      account: {label: "Account"},
      entry_on: {label: "Date", data_type: :date},
      amount: {label: "Total", data_type: :currency},
      percentage: {label: "Owner Percent", data_type: :percent, precision: "0", skip_total: true},
      fractional_amount: {label: "Amount", data_type: :currency},
    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end

  def configure_query
    self.sql = "
      SELECT
        property_owners.name,
        properties.name property,
        property_owners.phone_number,
        property_owners.email,
        property_ownerships.percentage,
        account_entries.entry_on,
        accounts.name account,
        CASE WHEN accounts.account_type IN ('#{Account::TYPE_EXPENSES}') THEN -1 ELSE 1 END * account_entries.amount as amount,
        (property_ownerships.percentage / 100) * (CASE WHEN accounts.account_type IN ('#{Account::TYPE_EXPENSES}') THEN -1 ELSE 1 END) * account_entries.amount as fractional_amount,
        CONCAT(CASE WHEN LENGTH(property_owners.street)>0 THEN CONCAT(property_owners.street, case when property_owners.street_2 is not null then concat(' ', property_owners.street_2, ', ') else ', ' end) ELSE '' END, CASE WHEN length(property_owners.city)> 0 THEN concat(property_owners.city, ', ') ELSE '' END, property_owners.state, ' ', property_owners.zip) address,
        CONCAT('/property_owners/', property_owners.id, '/edit') link_to_property_owner_edit
      FROM
        property_owners
      JOIN
        property_ownerships
      ON
        property_ownerships.property_owner_id = property_owners.id
      JOIN
        properties
      ON
        property_ownerships.property_id = properties.id
      JOIN
        account_entries
      ON
        account_entries.property_id = properties.id
      JOIN
        accounts
      ON
       accounts.id = account_entries.cash_account_id AND
       accounts.name NOT LIKE '%Utilities%'
      JOIN
       companies
      ON
       account_entries.company_id = companies.id
      WHERE
          account_entries.entry_on BETWEEN :start_date AND :end_date AND
          accounts.account_type IN ('#{Account::TYPE_INCOME}') AND
          property_owners.deleted_at IS NULL
    "


    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql += EfsReports::CriteriaPropertyOwner.where_sql(report.params[EfsReports::CriteriaPropertyOwner::criteria_id])

    self.sql = inject_security_and_hierarchy(self.sql)
  end
end