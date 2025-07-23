class RiReports::Vendors::VendorSummary < EfsReports::DataTableSection
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
      insurance_type: {label: "Insurance Type"},
      insurance_expires_on: {label: "Expiration Date", data_type: :date},
      license_type: {label: "License Type"},
      license_expires_on: {label: "License Expiration", data_type: :date},
      generate_1099: {label: "Generate 1099"}
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
        vendor_insurance_types.name insurance_type,
        vendor_insurances.expires_on insurance_expires_on,
        vendor_license_types.name license_type,
        vendor_licenses.expires_on license_expires_on,
        CASE WHEN vendors.generate_1099 = 1 THEN 'Yes' ELSE 'No' END generate_1099,
        CONCAT(CASE WHEN LENGTH(vendors.street)>0 THEN CONCAT(vendors.street, case when vendors.street_2 is not null then concat(' ', vendors.street_2, ', ') else ', ' end) ELSE '' END, CASE WHEN length(vendors.city)> 0 THEN concat(vendors.city, ', ') ELSE '' END, vendors.state, ' ', vendors.zip) address,
        CONCAT('/vendors/', vendors.id, '/edit') link_to_vendor_edit
      FROM
        companies
      JOIN
        vendors
      ON
        vendors.company_id = companies.id
      LEFT JOIN
        items vendor_categories
      ON
        vendors.vendor_category_id = vendor_categories.id AND
        vendor_categories.type = 'VendorCategory'
      LEFT JOIN
        vendor_insurances
      ON
        vendor_insurances.vendor_id = vendors.id
      LEFT JOIN
        items vendor_insurance_types
      ON
        vendor_insurances.insurance_type_id = vendor_insurance_types.id AND
        vendor_insurance_types.type = 'VendorInsuranceType'
      LEFT JOIN
        vendor_licenses
      ON
        vendor_licenses.vendor_id = vendors.id
      LEFT JOIN
        items vendor_license_types
      ON
        vendor_licenses.license_type_id = vendor_license_types.id AND
        vendor_license_types.type = 'VendorLicenseType'
      WHERE
        vendors.deleted_at IS NULL AND
        (vendor_insurances.id = (
              SELECT
                  id
              FROM
                  vendor_insurances
              WHERE
                  vendor_insurances.vendor_id = vendors.id
              ORDER BY
                  expires_on DESC, created_at DESC
              LIMIT 1
          )
          OR vendor_insurances.id IS NULL) AND
          (vendor_licenses.id = (
              SELECT
                  id
              FROM
                  vendor_licenses
              WHERE
                  vendor_licenses.vendor_id = vendors.id
              ORDER BY
                  expires_on DESC, created_at DESC
              LIMIT 1
          )
          OR vendor_licenses.id IS NULL)
       ORDER BY vendors.name
    "

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)
  end
end