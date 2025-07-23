class RiReports::Reconciliation::ReconciliationDetail < EfsReports::DataTableSection
  include RiReportingHelper

  def heading
    "Details"
  end

  def configure_columns
    {
      entry_on: {label: "Date", data_type: :date},
      entry_type: {label: "Type"},
      memo: {label: "Memo"},
      amount: {label: "Amount", data_type: :currency},
    }
  end

  def configure_row_groups
    { entry_group: :entry_group }
  end

  def credit_title
    'Charges and cash advances cleared'
  end

  def debit_title
    'Payments and credits cleared'
  end
 
  def configure_query
    self.sql = "#{expenses_sql} UNION #{ledger_items_sql} UNION #{journal_entry_splits_sql}"

    self.sql = inject_security_and_hierarchy(self.sql)

    self.sql += " ORDER BY entry_group"
  end

  def expenses_sql
    sql = "
      SELECT
        expenses.due_on entry_on,
        'Expense' as entry_type,
        CASE WHEN vendors.name IS NOT NULL AND expenses.description IS NOT NULL THEN concat(vendors.name, ': ', expenses.description) WHEN vendors.name IS NOT NULL THEN vendors.name ELSE expenses.description END as memo,
        -1 * expenses.amount as amount,
        '#{debit_title}' entry_group
      FROM
         account_reconciliations
      JOIN
         companies
      ON
        account_reconciliations.company_id = companies.id
      JOIN
        expenses
      ON
        expenses.account_reconciliation_id = account_reconciliations.id
      LEFT OUTER JOIN
        vendors
      ON
        expenses.vendor_id = vendors.id
      WHERE
        expenses.deleted_at IS NULL
    "

    sql + EfsReports::CriteriaAccountReconciliation.where_sql(report.params[EfsReports::CriteriaAccountReconciliation::criteria_id])
  end

  def ledger_items_sql
    sql = "
      SELECT
        CONVERT_TZ(ledger_items.transaction_at, 'UTC', 'US/Mountain') entry_on,
        ledger_items.related_object_type as entry_type,
        '' as memo,
        SUM(account_entries.amount) amount,
        '#{credit_title}' entry_group
      FROM
         account_reconciliations
      JOIN
         companies
      ON
        account_reconciliations.company_id = companies.id
      JOIN
        bank_accounts
      ON
        bank_accounts.id = account_reconciliations.bank_account_id
      JOIN
        ledger_items
      ON
        ledger_items.account_reconciliation_id = account_reconciliations.id AND
        ledger_items.deleted_at IS NULL
      JOIN
        account_entries
      ON
        account_entries.related_object_type = '#{LedgerItem.to_s}' AND
        account_entries.related_object_id = ledger_items.id AND
        account_entries.cash_account_id = bank_accounts.account_id

      WHERE 1=1
        #{EfsReports::CriteriaAccountReconciliation.where_sql(report.params[EfsReports::CriteriaAccountReconciliation::criteria_id])}
      GROUP BY
        entry_on
    "

  end


  def journal_entry_splits_sql
    sql = "
      SELECT
        journal_entries.entry_on,
        'Journal Entry' as entry_type,
        CASE WHEN LENGTH(journal_entry_splits.description) > 0 THEN journal_entry_splits.description ELSE  journal_entries.memo END as memo,
        -1 * journal_entry_splits.amount as amount,
        CASE WHEN journal_entry_splits.amount > 0 THEN '#{debit_title}' ELSE '#{credit_title}' END entry_group
      FROM
         account_reconciliations
      JOIN
         companies
      ON
        account_reconciliations.company_id = companies.id
      JOIN
        journal_entry_splits
      ON
        journal_entry_splits.account_reconciliation_id = account_reconciliations.id
      JOIN
        journal_entries
      ON
        journal_entry_splits.journal_entry_id = journal_entries.id

      WHERE 1=1
    "

    sql + EfsReports::CriteriaAccountReconciliation.where_sql(report.params[EfsReports::CriteriaAccountReconciliation::criteria_id])

  end
end