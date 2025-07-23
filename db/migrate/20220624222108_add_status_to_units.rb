class AddStatusToUnits < ActiveRecord::Migration[6.1]
  def change
    add_column :units, :status, :string, index: true, after: :zip, default: Unit::STATUS_VACANT

    Unit.all.each do | unit |
      unit.update_status
    end
  end
end
