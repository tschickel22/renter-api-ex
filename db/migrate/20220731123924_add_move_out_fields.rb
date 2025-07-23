class AddMoveOutFields < ActiveRecord::Migration[6.1]
  def change
    add_column :leases, :previous_lease_id, :integer, index: true, after: :screening_payment_method_id
    add_column :leases, :move_out_step, :string, after: :screening_payment_method_id

    add_column :lease_residents, :notice_given_on, :date, after: :application_completed_at
    add_column :lease_residents, :move_out_intention, :string, after: :notice_given_on

    add_column :lease_residents, :forwarding_street, :string, after: :notice_given_on
    add_column :lease_residents, :forwarding_city, :string, after: :forwarding_street
    add_column :lease_residents, :forwarding_state, :string, after: :forwarding_city
    add_column :lease_residents, :forwarding_zip, :string, after: :forwarding_state
  end
end
