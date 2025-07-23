class AddMonthlyChargesView < ActiveRecord::Migration[6.1]
  def change
    execute "
    CREATE VIEW other_monthly_charges AS
    SELECT
             lease_id,
             max(description_1) charge_description_1,
             max(description_2) charge_description_2,
             max(amount_1) charge_amount_1,
             max(amount_2) charge_amount_2
      FROM
        (SELECT charges.lease_id,
                COALESCE(CASE WHEN RANK() OVER (PARTITION BY lease_id
                                                ORDER BY amount DESC, id) = 1 THEN charges.description ELSE NULL END) description_1 ,
                COALESCE(CASE WHEN RANK() OVER (PARTITION BY lease_id
                                                ORDER BY amount DESC, id) = 2 THEN charges.description ELSE NULL END) description_2,
                                                COALESCE(CASE WHEN RANK() OVER (PARTITION BY lease_id
                                                ORDER BY amount DESC, id) = 1 THEN charges.amount ELSE NULL END) amount_1 ,
                COALESCE(CASE WHEN RANK() OVER (PARTITION BY lease_id
                                                ORDER BY amount DESC, id) = 2 THEN charges.amount ELSE NULL END) amount_2
         FROM charges
         WHERE frequency='#{Charge::FREQUENCY_MONTHLY}'
           AND charge_type_id != #{ChargeType::RENT}) sub
      GROUP BY lease_id
            "
  end
end
