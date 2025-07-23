class RiReports::IncomeStatement::IncomeStatementDetail < EfsReports::DataTableAutoColumnsSection
  include RiReportingHelper

  def initialize(args)
    super(args.merge({hide_group_header: true}))
  end

  def configure_columns
    cols = Hash.new

    if report.params[EfsReports::CriteriaGroupByMethod::criteria_id] == "month"
      per_column = :month
      cols[:month] = {sort_by: :month_sort}
    else
      per_column = :property
      cols[:property] = {}
    end

    cols[:account_type] = {label: 'Account Type', hidden: true}
    cols[:account_category] = {label: 'Category', hidden: true}
    cols[:account_name] = {label: 'Name', group_by: true, drill_down: :link_to_general_ledger}
    cols[:amount] = {data_type: :currency, per_column: per_column}

    return cols
  end

  def configure_row_groups
    { net_income: :net_income, account_type: :account_type, account_category: :account_category }
  end

  def configure_query

    if report.params[EfsReports::CriteriaGroupByMethod::criteria_id] == "month"
      addl_select = "date_format(account_entries.entry_on, '%m/%Y') month, date_format(account_entries.entry_on, '%Y-%m') month_sort"
      addl_group_by = "date_format(account_entries.entry_on, '%m/%Y')"
    else
      addl_select = "IFNULL(properties.name, companies.name) property"
      addl_group_by = "properties.name"
    end

    self.sql = "
      SELECT 'Net Income' net_income,
             #{addl_select},
             #{account_type_pretty_sql()} AS account_type,
             accounts.name account_name,
             account_categories.name account_category,
             sum(CASE WHEN accounts.account_type IN ('#{Account::TYPE_EXPENSES}') THEN -1 ELSE 1 END * account_entries.amount) amount,
             #{link_to_general_ledger_sql(report)}
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      JOIN account_categories ON account_categories.id = accounts.account_category_id
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          account_entries.entry_on BETWEEN :start_date AND :end_date AND
          accounts.account_type IN ('#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}') "

    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

    self.sql += "
        GROUP BY
               #{addl_group_by},
               account_categories.name,
               accounts.account_type,
               accounts.name
        ORDER BY
              account_category desc,
              account_name
   "
  end

  def arrange_data
    super

    # Re-work Net Income summary_data so that it is Income - Expenses
    if data["Net Income"].present? && data["Net Income"][:subgroups]["Income"].present?
      new_summary_data = Hash.new

      income_summary_data = data["Net Income"][:subgroups]["Income"][:summary_data]
      expense_summary_data = data["Net Income"][:subgroups]["Expenses"].present? ? data["Net Income"][:subgroups]["Expenses"][:summary_data] : {}

      income_summary_data.keys.each do |key|
        new_summary_data[key] = BigDecimal(income_summary_data[key] || 0) - BigDecimal(expense_summary_data[key] || 0)
      end

      data["Net Income"][:summary_data] = new_summary_data
    end

  end
end