class PopulatePropertyStats
  def self.perform(months_ago = 0, property_ids = nil)

    property_ids = property_ids.split(",") if property_ids.is_a?(String)

    if months_ago == 0
      first_day_of_month_sql = "date_add(date_add(LAST_DAY(CONVERT_TZ(now(), 'UTC', 'US/Mountain')),interval 1 DAY),interval - 1 MONTH)"

      addl_where_sql = property_ids.present? ? " AND properties.id in (#{property_ids.collect{|z| z.to_i}.join(",")})" : ""

      occupancy_sql = "
        SELECT
            properties.company_id,
            properties.id property_id,
            #{first_day_of_month_sql} report_date,
            COUNT(distinct units.id) units_total,
            SUM(CASE WHEN units.status = '#{Unit::STATUS_VACANT_LEASED}' THEN 1 ELSE 0 END) units_vacant_leased,
            SUM(CASE WHEN units.status = '#{Unit::STATUS_OCCUPIED}' THEN 1 ELSE 0 END) units_occupied,
            0 as rent_billed,
            0 as rent_collected,
            0 as income,
            0 as expenses,
            NOW() updated_at
          FROM
            companies
          JOIN
            properties
          ON
            properties.company_id = companies.id
          LEFT OUTER JOIN
            units
          ON
            units.property_id = properties.id
          WHERE
            properties.deleted_at IS NULL AND
            units.deleted_at IS NULL
            #{addl_where_sql}
          GROUP BY
            properties.company_id,
            properties.id,
            #{first_day_of_month_sql}
      "
      ReportingDataService.replace_into(occupancy_sql,"property_stats", %w[company_id property_id report_date units_total units_vacant_leased units_occupied rent_billed rent_collected income expenses updated_at])
    end

    # These update for all months
    PopulatePropertyStats.populate_with_account_entries(Account::METHOD_ACCRUAL, "accounts.code = '#{Account::CODE_RENTAL_INCOME}'", "rent_billed", property_ids)
    PopulatePropertyStats.populate_with_account_entries(Account::METHOD_CASH, "accounts.code = '#{Account::CODE_RENTAL_INCOME}'", "rent_collected", property_ids)
    PopulatePropertyStats.populate_with_account_entries(Account::METHOD_CASH, "accounts.account_type = '#{Account::TYPE_INCOME}'", "income", property_ids)
    PopulatePropertyStats.populate_with_account_entries(Account::METHOD_CASH, "accounts.account_type = '#{Account::TYPE_EXPENSES}'", "expenses", property_ids)



  end

  def self.populate_with_account_entries(accounting_method, account_entries_criteria, amount_name, property_ids)

    # For rent calculations roll the last 6 days of the month forward
    report_date_sql = if ['rent_billed', 'rent_collected'].include?(amount_name)
      "date_add(date_add(LAST_DAY(account_entries.entry_on + interval 7 day),interval 1 DAY),interval -1 MONTH)"
    else
      "date_add(date_add(LAST_DAY(account_entries.entry_on),interval 1 DAY),interval -1 MONTH)"
    end

    addl_where_sql = property_ids.present? ? " AND properties.id in (#{property_ids.collect{|z| z.to_i}.join(",")})" : ""

    sql = "
      SELECT properties.company_id,
             properties.id property_id,
             #{report_date_sql} report_date,
             SUM(amount) #{amount_name}
      FROM companies
      JOIN properties ON properties.company_id = companies.id
      JOIN accounts ON accounts.company_id= companies.id
           AND (#{account_entries_criteria})
      JOIN account_entries ON account_entries.property_id = properties.id
      AND #{accounting_method}_account_id=accounts.id
      WHERE properties.deleted_at IS NULL
        AND account_entries.entry_on <= DATE(CONVERT_TZ(now(), 'UTC', 'US/Mountain'))
        #{addl_where_sql}
      GROUP BY properties.company_id,
               properties.id,
               #{report_date_sql}
    "

    ReportingDataService.update(sql,"property_stats", %w[company_id property_id report_date], [amount_name])
  end
end