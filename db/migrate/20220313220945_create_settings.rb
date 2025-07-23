class CreateSettings < ActiveRecord::Migration[6.1]
  def change
    create_table :settings do |t|
      t.integer :company_id
      t.integer :property_id
      t.boolean :prorate_rent_at_lease_start_and_end
      t.boolean :prorate_move_in_charges
      t.string :prorate_type
      t.decimal :payment_fee_ach_property, precision: 10, scale: 2
      t.decimal :payment_fee_ach_resident, precision: 10, scale: 2
      t.decimal :payment_fee_credit_card_property, precision: 10, scale: 2
      t.decimal :payment_fee_credit_card_resident, precision: 10, scale: 2
      t.decimal :payment_fee_debit_card_property, precision: 10, scale: 2
      t.decimal :payment_fee_debit_card_resident, precision: 10, scale: 2
      t.boolean :resident_responsible_application_fee_ach
      t.boolean :resident_responsible_application_fee_credit_card
      t.boolean :resident_responsible_security_deposit_ach
      t.boolean :resident_responsible_security_deposit_credit_card
      t.boolean :resident_responsible_recurring_charges_ach
      t.boolean :resident_responsible_recurring_charges_credit_card
      t.boolean :resident_responsible_one_time_charges_ach
      t.boolean :resident_responsible_one_time_charges_credit_card
      t.boolean :resident_responsible_final_amount_ach
      t.boolean :resident_responsible_final_amount_credit_card
      t.boolean :charge_residents_late_rent_fee
      t.string :late_rent_fee_charge_type
      t.decimal :late_rent_fee_charge_fixed, precision: 10, scale: 2
      t.decimal :late_rent_fee_charge_daily, precision: 10, scale: 2
      t.decimal :late_rent_fee_charge_percentage, precision: 10, scale: 2
      t.integer :grace_period
      t.decimal :late_rent_fee_minimum_amount, precision: 10, scale: 2
      t.decimal :late_rent_fee_maximum_amount, precision: 10, scale: 2

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
