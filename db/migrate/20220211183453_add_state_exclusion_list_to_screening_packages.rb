class AddStateExclusionListToScreeningPackages < ActiveRecord::Migration[6.1]
  def change
    add_column :screening_packages, :state_exclusion_list, :string, after: :external_screening_id

    ScreeningPackage.where(id: [1, 2]).each do | sp |
      sp.state_exclusion_list = ["NY"]
      sp.save
    end
  end
end
