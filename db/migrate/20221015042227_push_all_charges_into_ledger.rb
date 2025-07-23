class PushAllChargesIntoLedger < ActiveRecord::Migration[6.1]
  def change
    base_sql = "SELECT charges.*
                 FROM charges
                 JOIN leases
                 ON leases.id = charges.lease_id AND leases.status in ('#{Lease::STATUS_CURRENT}', '#{Lease::STATUS_FUTURE}')
                  LEFT OUTER JOIN ledger_items
                  ON ledger_items.related_object_id = charges.id
                     AND ledger_items.related_object_type='#{Charge.to_s}'
                     AND ledger_items.type = '#{ResidentLedgerItem.to_s}'
                    "

    unposted_one_time_charges_sql = "#{base_sql}
                                      WHERE
                                        charges.frequency = '#{Charge::FREQUENCY_ONE_TIME}'
                                        AND charges.proposed = 0
                                        AND charges.type = '#{ResidentCharge.to_s}'
                                        AND ledger_items.id IS NULL"

    one_time_charges = ResidentCharge.find_by_sql(unposted_one_time_charges_sql)

    one_time_charges.each do | charge |
      AccountingService.push_to_ledger(charge)
    end

    unposted_monthly_time_charges_sql = "#{base_sql}
                WHERE
                    charges.frequency = '#{Charge::FREQUENCY_MONTHLY}'
                    AND charges.proposed = 0
                    AND charges.type = '#{ResidentCharge.to_s}'
                    "

    monthly_charges = ResidentCharge.find_by_sql(unposted_monthly_time_charges_sql)

    monthly_charges.each do | charge |
      AccountingService.push_to_ledger(charge)
    end
  end
end
