class AddDebitCardToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :resident_responsible_application_fee_debit_card, :boolean, after: :resident_responsible_application_fee_credit_card
    add_column :settings, :resident_responsible_security_deposit_debit_card, :boolean, after: :resident_responsible_security_deposit_credit_card
    add_column :settings, :resident_responsible_recurring_charges_debit_card, :boolean, after: :resident_responsible_recurring_charges_credit_card
    add_column :settings, :resident_responsible_one_time_charges_debit_card, :boolean, after: :resident_responsible_one_time_charges_credit_card
    add_column :settings, :resident_responsible_final_amount_debit_card, :boolean, after: :resident_responsible_final_amount_credit_card
  end
end
