class RemoveSetting < ActiveRecord::Migration[6.1]
  def change
    remove_column :settings, :prorate_move_in_charges
  end
end
