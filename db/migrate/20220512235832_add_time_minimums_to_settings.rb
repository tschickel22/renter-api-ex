class AddTimeMinimumsToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :employment_histories_minimum, :integer, after: :application_include_employment_histories, default: 24
    add_column :settings, :resident_histories_minimum, :integer, after: :application_include_resident_histories, default: 24
  end
end
