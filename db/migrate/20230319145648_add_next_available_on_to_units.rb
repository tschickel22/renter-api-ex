class AddNextAvailableOnToUnits < ActiveRecord::Migration[6.1]
  def change
    add_column :units, :available_on, :date, after: :status

    Unit.all.each do | unit |
      unit.update_status
    end
  end
end
