class RiReports::GeneralLedger::GeneralLedgerDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def configure_columns
    {
      entry_on: {label: 'Date', data_type: :date},
      property: {},
      account_type: {label: 'Account Type'},
      account_code: {label: 'Code'},
      transaction_type: {},
      description: {drill_down: :link_to_drill_down_on_account_entry},
      account_name: {label: 'Detail Type'},
      debits: {data_type: :currency},
      credits: {data_type: :currency}

    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end

  def configure_query
    self.sql = "
      SELECT
           account_entries.entry_on,
           IFNULL(properties.name, companies.name) property,
           #{account_type_pretty_sql()} AS account_type,
           accounts.name account_name,
           #{account_code_pretty_sql()} account_code,
           CASE
              WHEN account_entries.related_object_type = '#{Expense}' THEN (CASE WHEN expenses.paid_on IS NOT NULL THEN 'Expense' ELSE 'Bill' END)
              WHEN account_entries.related_object_type = '#{JournalEntry}' THEN 'Journal Entry'
              WHEN ledger_items.related_object_type = '#{PaymentReturn}' THEN 'Payment Return'
              ELSE ledger_items.related_object_type
           END transaction_type,
           CASE WHEN account_entries.amount < 0 THEN -1 * account_entries.amount ELSE NULL END debits,
           CASE WHEN account_entries.amount > 0 THEN account_entries.amount ELSE NULL END credits,
           concat(ledger_items.related_object_type, ledger_items.related_object_id) as vendor_or_expense_name,
          CASE
            WHEN LENGTH(account_entries.description) > 0 THEN account_entries.description
            WHEN ledger_items.related_object_type = '#{PaymentReturn}' THEN concat('Payment Return #', payment_returns.hash_id)
            WHEN ledger_items.related_object_type = '#{Payment}' THEN concat('Payment #', payments.hash_id)
            WHEN ledger_items.related_object_type = '#{Charge}' AND LENGTH(charges.description) > 0 THEN charges.description
            WHEN account_entries.related_object_type = '#{Expense}' THEN (CASE WHEN LENGTH(expenses.description) > 0 THEN expenses.description ELSE concat('Expense #', expenses.hash_id) END)
            WHEN account_entries.related_object_type = '#{JournalEntry}' THEN (CASE WHEN LENGTH(journal_entries.memo) > 0 THEN journal_entries.memo ELSE concat('Journal Entry #', journal_entries.hash_id) END)
            ELSE charge_types.name
         END description,
        #{link_to_drill_down_on_account_entry_sql()}
      FROM account_entries
      JOIN accounts ON accounts.id = account_entries.#{EfsReports::CriteriaAccountingMethod.where_sql(report.params[EfsReports::CriteriaAccountingMethod::criteria_id])}
      LEFT OUTER JOIN properties ON account_entries.property_id = properties.id
      JOIN companies ON account_entries.company_id = companies.id
      LEFT OUTER JOIN ledger_items ON account_entries.related_object_type = '#{LedgerItem}' AND account_entries.related_object_id = ledger_items.id AND ledger_items.deleted_at IS NULL
      LEFT OUTER JOIN expenses ON account_entries.related_object_type = '#{Expense}' AND account_entries.related_object_id = expenses.id AND expenses.deleted_at IS NULL
      LEFT OUTER JOIN journal_entries ON account_entries.related_object_type = '#{JournalEntry}' AND account_entries.related_object_id = journal_entries.id
      LEFT OUTER JOIN leases ON ledger_items.lease_id = leases.id
      LEFT OUTER JOIN charges ON ledger_items.related_object_type = '#{Charge}' AND ledger_items.related_object_id = charges.id
      LEFT OUTER JOIN charge_types ON charge_types.id = charges.charge_type_id
      LEFT OUTER JOIN payments ON ledger_items.related_object_type = '#{Payment}' AND ledger_items.related_object_id = payments.id
      LEFT OUTER JOIN payment_returns ON ledger_items.related_object_type = '#{PaymentReturn}' AND ledger_items.related_object_id = payment_returns.id
      WHERE
          account_entries.entry_on BETWEEN :start_date AND :end_date
"
    self.sql += EfsReports::CriteriaProperty.where_sql(report.params[EfsReports::CriteriaProperty::criteria_id])
    self.sql = inject_security_and_hierarchy(self.sql)

    if !report.params[:account_id].blank?
      self.sql += " AND accounts.id = :account_id"
    end

    if !report.params[:account_type].blank?
      self.sql += " AND accounts.account_type = :account_type"
    end

  end

  def link_to_drill_down_on_account_entry_sql()
    "CASE WHEN leases.hash_id IS NOT NULL THEN CONCAT('/leases/', leases.hash_id, '/ledger')
          WHEN expenses.hash_id IS NOT NULL THEN CONCAT('/expenses/', expenses.hash_id, '/edit')
          WHEN journal_entries.hash_id IS NOT NULL THEN CONCAT('/journal_entries/', journal_entries.hash_id, '/edit')
          ELSE NULL
    END  link_to_drill_down_on_account_entry"
  end
end