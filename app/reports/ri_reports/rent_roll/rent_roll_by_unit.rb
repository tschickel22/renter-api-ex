class RiReports::RentRoll::RentRollByUnit < EfsReports::DataTableSection
  include RiReportingHelper

  def initialize(args)
    super

    self.table_wrapper_class = 'reporting-no-wrap-headers'
  end

  def configure_columns
    cols = {
      unit_street: {label: 'Street'},
      unit_number: {label: 'Unit', data_type: :integer_or_string},
      unit_floor_plan_name: {label: 'Floor Plan'},
      resident: {label: 'Tenant name', drill_down: :link_to_lease_show},
      unit_square_feet: {label: 'Square feet'},
      unit_beds_baths: {label: 'Beds/baths'},
      has_insurance: {label: 'Renters Insurance'},
      has_auto_pay: {label: 'Auto Pay'},
      rent: {label: 'Current Rent', data_type: :currency},
      security_deposit: {label: 'Security Deposit On Hand', data_type: :currency},
      charge_description_1: {label: 'Other Charges 1'},
      charge_amount_1: {label: 'Other Charges 1 Amount', data_type: :currency},
      charge_description_2: {label: 'Other Charges 2'},
      charge_amount_2: {label: 'Other Charges 2 Amount', data_type: :currency},
      lease_start_on: {label: 'Lease start date', data_type: :date},
      lease_end_on: {label: 'Lease end date', data_type: :date},
      days_remaining: {label: 'Days Remaining on Lease'},
      is_lease_renewed: {label: 'Renewed'},
      status: {label: 'Status', data_type: :lookup, replacements: Unit::STATUS_OPTIONS},
      has_active_listing: {label: 'Active Listing?'},
    }

    # Build out expiration month grid
    for i in 0..11
      cols["expiration_month_#{i}"] = {label: (PaymentService.todays_date().beginning_of_month + i.months).strftime('%m/%d/%Y'), data_type: :date}
    end

    cols
  end

  def configure_query

    expiration_month_sql = []
    for i in 0..11
      expiration_month_sql << "CASE WHEN leases.lease_end_on BETWEEN '#{(PaymentService.todays_date().beginning_of_month + i.months).strftime('%Y-%m-%d')}' AND '#{(PaymentService.todays_date().beginning_of_month + (i+1).months - 1.day).strftime('%Y-%m-%d')}' AND  IFNULL(leases.lease_term,0) != #{Lease::TERM_MONTH_TO_MONTH} THEN leases.lease_end_on ELSE NULL END expiration_month_#{i}"
    end

    self.sql = "
      SELECT
        properties.name property,

        units.street unit_street,
        units.unit_number,
        units.square_feet unit_square_feet,
        units.floor_plan_name unit_floor_plan_name,
        units.status,
        CASE WHEN unit_listings.status = '#{UnitListing::STATUS_ACTIVE}' THEN 'Yes' ELSE 'No' END has_active_listing,
        CONCAT(CASE WHEN units.beds = -1 THEN 'Studio' ELSE concat(units.beds, ' BR') END, ' / ', units.baths, ' BA') unit_beds_baths,

        leases.rent,
        leases.security_deposit,
        leases.lease_start_on,
        CASE WHEN leases.lease_term = #{Lease::TERM_MONTH_TO_MONTH} THEN 'MTM' ELSE leases.lease_end_on END lease_end_on,
        CASE WHEN leases.lease_term = #{Lease::TERM_MONTH_TO_MONTH} THEN NULL ELSE DATEDIFF(leases.lease_end_on, curdate()) END days_remaining,
        CASE WHEN leases.previous_lease_id > 0 THEN 'Yes' ELSE 'No' END is_lease_renewed,

        other_monthly_charges.charge_description_1,
        other_monthly_charges.charge_description_2,
        other_monthly_charges.charge_amount_1,
        other_monthly_charges.charge_amount_2,

        concat(residents.first_name, ' ', residents.last_name) resident,
        CASE WHEN insurances.lease_resident_id IS NOT NULL THEN 'Yes' ELSE 'No' END has_insurance,
        CASE WHEN lease_residents.recurring_payment_method_id IS NOT NULL AND lease_residents.recurring_payment_frequency != '#{LeaseResident::RECURRING_PAYMENT_FREQUENCY_NONE}' THEN 'Yes' ELSE 'No' END has_auto_pay,

        CONCAT('/leases/', leases.hash_id) link_to_lease_show,

        #{expiration_month_sql.join(",\n")}
      FROM
        companies
      JOIN
        properties
      ON
        properties.company_id = companies.id AND
        properties.deleted_at IS NULL
      JOIN
        units
      ON
        units.property_id = properties.id AND
        units.deleted_at IS NULL
      LEFT OUTER JOIN
        unit_listings
      ON
        unit_listings.unit_id = units.id
      LEFT OUTER JOIN
        leases
      ON
        leases.property_id = properties.id AND
        leases.unit_id = units.id AND
        leases.id = units.current_lease_id
      LEFT OUTER JOIN
        lease_residents
      ON
        lease_residents.lease_id = leases.id AND
        lease_residents.type = '#{LeaseResidentPrimary.to_s}'
      LEFT OUTER JOIN
        other_monthly_charges
      ON
        other_monthly_charges.lease_id = leases.id
      LEFT OUTER JOIN
        (~insurance_subquery~) insurances
      ON
        insurances.lease_resident_id = lease_residents.id
      LEFT OUTER JOIN
        residents
      ON
        residents.id = lease_residents.resident_id
      WHERE 1=1
"

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql += EfsReports::CriteriaUnitStatus.where_sql(report.params[EfsReports::CriteriaUnitStatus::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

    self.sql = self.sql.gsub("~insurance_subquery~", "SELECT DISTINCT lease_resident_id FROM insurances WHERE status = '#{Insurance::STATUS_ACTIVE}'")
  end
end