class RemoveSettingForSsn < ActiveRecord::Migration[6.1]
  def change
    remove_column :settings, :application_allow_no_ssn_applicants
  end
end
