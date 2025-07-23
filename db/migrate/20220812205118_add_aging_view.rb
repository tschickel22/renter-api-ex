class AddAgingView < ActiveRecord::Migration[6.1]
  def change
    execute "CREATE OR REPLACE VIEW ledger_aging as
                 with `data` as (select `ledger_items`.`lease_id` AS `lease_id`,cast(`ledger_items`.`transaction_at` as date) AS `day`,sum(`ledger_items`.`amount`) AS `ledger_amount` from `ledger_items` where ledger_items.type='ResidentLedgerItem' group by `ledger_items`.`lease_id`,`day`) select `sub`.`lease_id` AS `lease_id`,sum((case when (`sub`.`day` between (curdate() - interval 30 day) and curdate()) then `sub`.`ledger_amount` else 0 end)) AS `bucket_1`,sum((case when (`sub`.`day` between (curdate() - interval 60 day) and (curdate() - interval 31 day)) then `sub`.`ledger_amount` else 0 end)) AS `bucket_2`,sum((case when (`sub`.`day` between (curdate() - interval 90 day) and (curdate() - interval 61 day)) then `sub`.`ledger_amount` else 0 end)) AS `bucket_3`,sum((case when (`sub`.`day` < (curdate() - interval 90 day)) then `sub`.`ledger_amount` else 0 end)) AS `bucket_4`,sum(`sub`.`ledger_amount`) AS `total_due` from (select `data`.`lease_id` AS `lease_id`,`data`.`day` AS `day`,`data`.`ledger_amount` AS `ledger_amount`,sum(`data`.`ledger_amount`) OVER (PARTITION BY `data`.`lease_id` ORDER BY `data`.`day` )  AS `total_due` from `data`) `sub` group by `sub`.`lease_id`;`
"
  end
end
