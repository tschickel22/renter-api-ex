class RiReports::VendorPayments::VendorPaymentDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading 
    ""
  end

  def configure_columns
    {
      vendor: {label: "Vendor", drill_down: :link_to_vendor_edit},
      status: {label: "Status"},
      vendor_category: {label: "Category"},
      phone_number: {label: "Phone"},
      email: {label: "Email"},
      address: {label: "Address"},
      paid_on: {label: "Paid On", data_type: :date, drill_down: :link_to_expense_edit},
      amount_paid: {label: "Amount Paid", data_type: :currency, drill_down: :link_to_expense_edit},
    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end

  def configure_query
    self.sql = "
      SELECT
        vendors.name as vendor,
        vendors.status,
        vendor_categories.name as vendor_category,
        vendors.phone_number,
        vendors.email,
        CONCAT(CASE WHEN LENGTH(vendors.street)>0 THEN CONCAT(vendors.street, case when vendors.street_2 is not null then concat(' ', vendors.street_2, ', ') else ', ' end) ELSE '' END, CASE WHEN length(vendors.city)> 0 THEN concat(vendors.city, ', ') ELSE '' END, vendors.state, ' ', vendors.zip) address,
        CONCAT('/vendors/', vendors.id, '/edit') link_to_vendor_edit,
        CONCAT('/expenses/', expenses.hash_id, '/edit') link_to_expense_edit,
        expenses.paid_on,
        expenses.amount amount_paid
      FROM
        companies
      JOIN
        vendors
      ON
        vendors.company_id = companies.id
      JOIN
        expenses
      ON
        expenses.deleted_at IS NULL AND
        expenses.vendor_id = vendors.id AND
        expenses.company_id = companies.id AND
        expenses.paid_on BETWEEN :start_date and :end_date
      LEFT JOIN
        items vendor_categories
      ON
        vendors.vendor_category_id = vendor_categories.id AND
        vendor_categories.type = 'VendorCategory'
      WHERE
        vendors.deleted_at IS NULL
    "

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql += EfsReports::CriteriaVendor.where_sql(report.params[EfsReports::CriteriaVendor::criteria_id])

    self.sql = inject_security_and_hierarchy(self.sql)

    self.sql += " ORDER BY expenses.paid_on"
  end
end