class MoveNoticeGivenOn < ActiveRecord::Migration[6.1]
  def change
    remove_column :lease_residents, :notice_given_on
    add_column :leases, :notice_given_on, :date, after: :move_out_on
  end
end
