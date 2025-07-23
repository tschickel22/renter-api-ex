class RiReports::CompanyBreakdown::CompanySummary < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      company: {label: "Account Name"},
      company_admin_name: {label: "Company Admin Name"},
      company_admin_email: {label: "Company Admin Email"},
      company_created_at: {label: "Activation Date", data_type: :date},
      subscription_frequency: {label: "Zoho Subscription"},
      active_properties_count: {label: "# Active Properties", data_type: :integer},
      active_units_count: {label: "# Active Units", data_type: :integer},
      financial_connection_subscriptions_count: {label: "# Financial Connection Subscriptions", data_type: :integer},
      active_msi_policies_count: {label: "# Active MSI Policies", data_type: :integer},
      active_credit_builder_count: {label: "# Active Credit Builder", data_type: :integer},

      screening_trans_count: {label: "# Screening Trans", data_type: :integer},
      ach_payments_count: {label: "# ACH Trans", data_type: :integer},
      ach_revenue: {label: "ACH Revenue", data_type: :currency},
      debit_card_payments_count: {label: "# Debit Trans", data_type: :integer},
      credit_card_payments_total: {label: "$ Credit Card Processed", data_type: :currency},
      ro1_ach_count: {label: "# RO1 ACH", data_type: :integer},
      #documents_count: {label: "# Documents", data_type: :integer},
    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end

  def configure_query
    self.sql = "
      SELECT
        companies.id company_id,
        companies.name company,
        subscription_frequency,
        convert_tz(companies.created_at, 'UTC', 'US/Mountain') as company_created_at
      FROM
        companies
      WHERE
        companies.subscription_status = '#{Company::SUBSCRIPTION_STATUS_ACTIVE}'
      ORDER BY company
     "
  end

  def run_company_admin_data_query
    pull_sub_data "SELECT company_id, concat(first_name, ' ', last_name) as company_admin_name, email as company_admin_email FROM users WHERE user_type='#{User::TYPE_COMPANY_ADMIN}' ORDER BY id"
  end

  def run_property_data_query
    pull_sub_data "SELECT properties.company_id, count(distinct properties.id) active_properties_count, count(distinct units.id) active_units_count FROM properties LEFT OUTER JOIN units ON units.property_id = properties.id AND units.deleted_at IS NULL WHERE properties.status = '#{Property::STATUS_ACTIVE}' GROUP BY properties.company_id"
  end

  def run_insurance_query
    pull_sub_data "SELECT insurances.company_id, count(*) active_msi_policies_count FROM insurances WHERE insurances.status = '#{Insurance::STATUS_ACTIVE}' GROUP BY insurances.company_id"
  end

  def run_credit_builder_query
    pull_sub_data "SELECT leases.company_id, count(distinct residents.id) active_credit_builder_count FROM properties JOIN leases ON leases.property_id = properties.id JOIN lease_residents ON lease_residents.lease_id = leases.id JOIN residents ON residents.id = lease_residents.resident_id WHERE residents.credit_builder_status = '#{CreditReportingActivity::CREDIT_BUILDER_STATUS_ACTIVE}' AND properties.status = '#{Property::STATUS_ACTIVE}' GROUP BY leases.company_id"
  end

  def run_screening_trans_query
    pull_sub_data "SELECT leases.company_id, count(distinct screening_requests.id) screening_trans_count FROM properties JOIN leases ON leases.property_id = properties.id JOIN lease_residents ON lease_residents.lease_id = leases.id JOIN screening_requests ON screening_requests.lease_resident_id = lease_residents.id WHERE properties.status = '#{Property::STATUS_ACTIVE}' AND convert_tz(screening_requests.created_at, 'UTC', 'US/Mountain') BETWEEN :start_date AND :end_date GROUP BY leases.company_id"
  end

  def run_financial_connections_query
    pull_sub_data "SELECT bank_accounts.company_id, count(*) financial_connection_subscriptions_count FROM bank_accounts WHERE charged_for_connection_at is not null GROUP BY company_id"
  end

  def run_payment_returns_query
    pull_sub_data "SELECT leases.company_id, count(payment_returns.id) ro1_ach_count FROM properties JOIN leases ON leases.property_id = properties.id JOIN payment_returns ON payment_returns.lease_id = leases.id WHERE payment_returns.return_code = 'R01' AND properties.status = '#{Property::STATUS_ACTIVE}' AND convert_tz(payment_returns.payment_at, 'UTC', 'US/Mountain') BETWEEN :start_date and :end_date GROUP BY leases.company_id"
  end

  def run_payments_query
    pull_sub_data "SELECT properties.company_id, SUM(CASE WHEN payment_methods.method = '#{PaymentMethod::METHOD_ACH}' THEN 1 ELSE 0 END) as ach_payments_count, SUM(CASE WHEN payment_methods.method = '#{PaymentMethod::METHOD_ACH}' THEN payments.fee ELSE 0 END) as ach_revenue, SUM(CASE WHEN payment_methods.method = '#{PaymentMethod::METHOD_DEBIT_CARD}' THEN 1 ELSE 0 END) as debit_card_payments_count, SUM(CASE WHEN payment_methods.method = '#{PaymentMethod::METHOD_CREDIT_CARD}' THEN 1 ELSE 0 END) as credit_card_payments_count, SUM(CASE WHEN payment_methods.method = '#{PaymentMethod::METHOD_CREDIT_CARD}' THEN payments.amount ELSE 0 END) as credit_card_payments_total FROM properties JOIN  payments ON payments.property_id = properties.id JOIN payment_methods ON payments.payment_method_id = payment_methods.id WHERE payments.status = '#{Payment::STATUS_SUCCEEDED}' AND properties.status = '#{Property::STATUS_ACTIVE}' AND convert_tz(payments.payment_at, 'UTC', 'US/Mountain') BETWEEN :start_date and :end_date GROUP BY properties.company_id"
  end

  def pull_data
    super

    company_admin_data = run_company_admin_data_query
    property_data = run_property_data_query
    insurance_data = run_insurance_query
    credit_builder_data = run_credit_builder_query
    screening_trans_data = run_screening_trans_query
    financial_connection_data = run_financial_connections_query
    payment_return_data = run_payment_returns_query
    payments_data = run_payments_query

    # We have several other queries we need to run and merge into @raw_data
    @raw_data.each do | row |
      merge_data(row, company_admin_data, ["company_admin_name", "company_admin_email"])
      merge_data(row, property_data, ["active_properties_count", "active_units_count"])
      merge_data(row, insurance_data, ["active_msi_policies_count"])
      merge_data(row, credit_builder_data, ["active_credit_builder_count"])
      merge_data(row, screening_trans_data, ["screening_trans_count"])
      merge_data(row, financial_connection_data, ["financial_connection_subscriptions_count"])
      merge_data(row, payment_return_data, ["ro1_ach_count"])
      merge_data(row, payments_data, ["ach_payments_count", "ach_revenue", "debit_card_payments_count", "credit_card_payments_count", "credit_card_payments_total"])
    end
  end

  def pull_sub_data(sql)
    data = run_query(sql)
    company_data = {}
    data.each do | row |
      if company_data[row["company_id"]].nil?
        company_data[row["company_id"]] = row
      end
    end

    return company_data.values

  end

  def merge_data(row, data, fields)
    company_row = data.find{|r| r["company_id"] == row["company_id"] }

    if company_row.present?
      fields.each do | field |
        row[field] = company_row[field]
      end
    end
  end
end