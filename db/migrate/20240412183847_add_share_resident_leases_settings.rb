class AddShareResidentLeasesSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :share_resident_leases, :boolean, default: false
  end
end
