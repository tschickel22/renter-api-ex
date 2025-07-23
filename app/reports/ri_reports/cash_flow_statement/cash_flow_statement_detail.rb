class RiReports::CashFlowStatement::CashFlowStatementDetail < EfsReports::DataTableAutoColumnsSection
  include RiReportingHelper

  def initialize(args)
    super(args.merge({hide_group_header: true}))
  end

  def configure_columns
    cols = Hash.new

    if report.params[EfsReports::CriteriaGroupByMethod::criteria_id] == "month"
      per_column = :month
      cols[:month] = {}
    else
      per_column = :property
      cols[:property] = {}
    end

    cols[:cash_flows_group] = {group_by: true, hidden: true}
    cols[:cash_flows_sub_group] = {label: 'Name', group_by: true}
    cols[:amount] = {data_type: :currency, per_column: per_column}

    return cols
  end

  def configure_row_groups
    { cash_flows_group: :cash_flows_group}
  end

  def operating_title
    "Cash flows from operating activities"
  end

  def investing_title
    "Cash flows from investing activities"
  end

  def financing_title
    "Cash flows from financing activities"
  end

  def cash_net_title
    "Net increase (decrease) in cash"
  end

  def cash_start_title
    "Cash and cash equivalents, beginning of period"
  end

  def cash_end_title
    "Cash and cash equivalents, end of period"
  end

  def net_income_title
    "Net Income"
  end

  def receivables_title
    "Increase in receivables"
  end

  def payables_title
    "Decrease in payables"
  end

  def liabilities_title
    "Decrease in liabilities"
  end

  def assets_title
    "Increase in fixed assets"
  end

  def equity_title
    "Increase in equity"
  end

  def configure_query
    if report.params[EfsReports::CriteriaGroupByMethod::criteria_id] == "month"
      addl_select = "date_format(account_entries.entry_on, '%m/%Y') month"
      addl_group_by = "date_format(account_entries.entry_on, '%m/%Y')"
    else
      addl_select = "IFNULL(properties.name, companies.name) property"
      addl_group_by = "properties.name"
    end

    grouping_sql = "
      CASE
        WHEN accounts.account_type IN ('#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}')
          OR accounts.name like '%Accounts Receivable%'
          OR accounts.name like '%Accounts Payable%'
          OR accounts.account_type = '#{Account::TYPE_LIABILITY}' THEN '#{operating_title()}'
        WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}') and accounts.account_category_id != 1 THEN '#{investing_title()}'
        WHEN accounts.account_type IN ('#{Account::TYPE_EQUITY}') THEN '#{financing_title()}'
        ELSE
        'exclude'
      END
    "

    sub_grouping_sql = "
      CASE
        WHEN accounts.account_type IN ('#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}') THEN '#{net_income_title()}'
        WHEN accounts.name like '%Accounts Receivable%' THEN '#{receivables_title()}'
        WHEN accounts.name like '%Accounts Payable%' THEN '#{payables_title()}'
        WHEN accounts.account_type = '#{Account::TYPE_LIABILITY}' THEN '#{liabilities_title()}'
        WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}') and accounts.account_category_id != 1 THEN '#{assets_title()}'
        WHEN accounts.account_type IN ('#{Account::TYPE_EQUITY}') THEN '#{equity_title()}'
      END
    "

    sub_group_ordering_sql = "
      CASE
        WHEN accounts.account_type IN ('#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}') THEN 1
        WHEN accounts.name like '%Accounts Receivable%' THEN 2
        WHEN accounts.name like '%Accounts Payable%' THEN 3
        WHEN accounts.account_type = '#{Account::TYPE_LIABILITY}' THEN 4
        WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}') and accounts.account_category_id != 1 THEN 5
        WHEN accounts.account_type IN ('#{Account::TYPE_EQUITY}') THEN 6
      END
    "

    net_cash_sql = "
      SELECT
          #{grouping_sql} cash_flows_group,
          #{sub_grouping_sql} cash_flows_sub_group,
          #{addl_select},
          #{sub_group_ordering_sql} group_ordering,
          sum(account_entries.amount) amount
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          entry_on BETWEEN :start_date AND :end_date AND
          account_type IN ('#{Account::TYPE_ASSETS}','#{Account::TYPE_EQUITY}', '#{Account::TYPE_LIABILITY}', '#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}')
"
    net_cash_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    net_cash_sql = inject_security_and_hierarchy(net_cash_sql)

    net_cash_sql += "
           GROUP BY
               cash_flows_group,
               cash_flows_sub_group,
               #{addl_group_by},
              group_ordering
          HAVING
            cash_flows_group !='exclude' "

    net_cash_shell_sql = "
      SELECT
          '#{cash_net_title()}' cash_flows_group,
          1 cash_flows_sub_group,
          #{addl_select},
          9 group_ordering,
          0 amount
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          entry_on BETWEEN :start_date AND :end_date AND
          account_type IN ('#{Account::TYPE_ASSETS}','#{Account::TYPE_EQUITY}', '#{Account::TYPE_LIABILITY}', '#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}')
"
    net_cash_shell_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    net_cash_shell_sql = inject_security_and_hierarchy(net_cash_shell_sql)

    net_cash_shell_sql += "
           GROUP BY
               cash_flows_group,
               cash_flows_sub_group,
               #{addl_group_by},
              group_ordering
          HAVING
            cash_flows_group !='exclude' "

    start_cash_sql = "
      SELECT
          '#{cash_start_title}' cash_flows_group,
          1 cash_flows_sub_group,
          #{addl_select},
          10 group_ordering,
          sum(-1 * account_entries.amount) amount
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          entry_on < :start_date AND
          account_type IN ('#{Account::TYPE_ASSETS}') AND
          accounts.name NOT like '%Accounts Receivable%' AND
          accounts.account_category_id = 1
"
    start_cash_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    start_cash_sql = inject_security_and_hierarchy(start_cash_sql)

    start_cash_sql += "
           GROUP BY
               cash_flows_group,
               #{addl_group_by}
    "

    end_cash_sql = "
      SELECT
          '#{cash_end_title}' cash_flows_group,
          1 cash_flows_sub_group,
          #{addl_select},
          11 group_ordering,
          sum(-1 * account_entries.amount) amount
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          entry_on <= :end_date AND
          account_type IN ('#{Account::TYPE_ASSETS}') AND
          accounts.name NOT like '%Accounts Receivable%' AND
          accounts.account_category_id = 1
"
    end_cash_sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    end_cash_sql = inject_security_and_hierarchy(end_cash_sql)

    end_cash_sql += "
           GROUP BY
              cash_flows_group,
               #{addl_group_by}
    "


    self.sql = "
      #{net_cash_sql}
    UNION
      #{net_cash_shell_sql}
    UNION
      #{start_cash_sql}
    UNION
      #{end_cash_sql}
    ORDER BY
        group_ordering
   "
  end

  def arrange_data
    super

    self.data[cash_net_title()] = { raw_data: [], summary_data: {} }
    self.data[cash_start_title()].present? ? self.data[cash_start_title()][:raw_data] = [] : self.data[cash_start_title()] = {raw_data: [], summary_data: {}}
    self.data[cash_end_title()].present? ? self.data[cash_end_title()][:raw_data] = [] : self.data[cash_end_title()] = {raw_data: [], summary_data: {}}

    operating = self.data[operating_title()].present? ? self.data[operating_title()][:summary_data] : {}
    investing = self.data[investing_title()].present? ? self.data[investing_title()][:summary_data] : {}
    financing = self.data[financing_title()].present? ? self.data[financing_title()][:summary_data] : {}

    new_summary_data = Hash.new

    operating.each{| key, val| new_summary_data[key] = BigDecimal(val)}
    investing.each{| key, val| new_summary_data[key] = BigDecimal(new_summary_data[key] || 0) + BigDecimal(val)}
    financing.each{| key, val| new_summary_data[key] = BigDecimal(new_summary_data[key] || 0) + BigDecimal(val)}

    self.data[cash_net_title()][:summary_data] = new_summary_data

  end
end