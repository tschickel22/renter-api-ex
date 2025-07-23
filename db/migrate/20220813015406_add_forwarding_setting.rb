class AddForwardingSetting < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :forwarding_addresses_required, :boolean, default: true, after: :items_required_for_move_in
  end
end
