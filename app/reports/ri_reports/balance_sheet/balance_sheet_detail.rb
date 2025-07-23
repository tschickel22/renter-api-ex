class RiReports::BalanceSheet::BalanceSheetDetail < EfsReports::DataTableAutoColumnsSection
  include RiReportingHelper

  def initialize(args)
    super(args.merge({hide_group_header: true}))
  end

  def configure_columns
    {
      property: {},
      account_type: {label: 'Account Type', hidden: true},
      account_name: {label: 'Name', group_by: true, drill_down: :link_to_general_ledger},
      amount: {data_type: :currency, per_column: :property}
    }
  end

  def configure_row_groups
    { equity: :equity, account_type: :account_type }
  end

  def group_css_classes
    {"Assets": "report-level-0"}
  end

  def liability_and_equity_title
    "Liabilities + Equity"
  end

  def profit_loss_title
    "Current Profit (Loss)"
  end

  def configure_query
    self.sql = "
      SELECT
           '#{liability_and_equity_title()}' equity,
           IFNULL(properties.name, companies.name) property,
           CASE WHEN accounts.account_type IN ('#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}') THEN '#{profit_loss_title()}' ELSE #{account_type_pretty_sql()} END AS account_type,
           accounts.name account_name,
           #{link_to_general_ledger_sql(report)},
           sum(CASE WHEN accounts.account_type IN ('#{Account::TYPE_ASSETS}') THEN -1 ELSE 1 END * account_entries.amount) amount
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      WHERE
          entry_on <= :end_date AND
          account_type IN ('#{Account::TYPE_ASSETS}','#{Account::TYPE_EQUITY}', '#{Account::TYPE_LIABILITY}', '#{Account::TYPE_INCOME}', '#{Account::TYPE_EXPENSES}')
"
    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

    self.sql += "
           GROUP BY
               accounts.account_type,
               accounts.name,
               properties.name
           ORDER BY
               CASE
                WHEN accounts.account_type = '#{Account::TYPE_ASSETS}' THEN 1
                WHEN accounts.account_type = '#{Account::TYPE_LIABILITY}' THEN 2
                WHEN accounts.account_type = '#{Account::TYPE_EQUITY}' THEN 3
                WHEN accounts.account_type = '#{Account::TYPE_INCOME}' THEN 4
                WHEN accounts.account_type = '#{Account::TYPE_EXPENSES}' THEN 4
                ELSE  99
              END
   "
  end

  def arrange_data
    super

    if self.data[liability_and_equity_title()].present? && self.data[liability_and_equity_title()][:subgroups].present? && self.data[liability_and_equity_title()][:subgroups][profit_loss_title()].present?
      # This report is Assets - Liabilities
      # Don't show profit loss raw data
      self.data[liability_and_equity_title()][:subgroups][profit_loss_title()][:raw_data] = []
    end

    equity = self.data[liability_and_equity_title()].present? && self.data[liability_and_equity_title()][:subgroups]["Equity"].present? ? self.data[liability_and_equity_title()][:subgroups]["Equity"][:summary_data] : {}
    profit_loss = self.data[liability_and_equity_title()].present? && self.data[liability_and_equity_title()][:subgroups][profit_loss_title()].present? ? self.data[liability_and_equity_title()][:subgroups][profit_loss_title()][:summary_data] : {}
    liabilities = self.data[liability_and_equity_title()].present? && self.data[liability_and_equity_title()][:subgroups]["Liability"].present? ? self.data[liability_and_equity_title()][:subgroups]["Liability"][:summary_data] : {}

    new_summary_data = Hash.new

    equity.each{| key, val| new_summary_data[key] = BigDecimal(val)}
    liabilities.each{| key, val| new_summary_data[key] = BigDecimal(new_summary_data[key] || 0) + BigDecimal(val)}
    profit_loss.each{| key, val| new_summary_data[key] = BigDecimal(new_summary_data[key] || 0) + BigDecimal(val)}

    data[liability_and_equity_title()][:summary_data] = new_summary_data

  end
end