class AddInternalTicketToMaintReq < ActiveRecord::Migration[6.1]
  def change
    add_column :maintenance_requests, :internal_ticket, :boolean, default: false, after: :recurring
  end
end
