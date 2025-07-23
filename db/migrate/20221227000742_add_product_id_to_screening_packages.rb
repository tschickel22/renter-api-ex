class AddProductIdToScreeningPackages < ActiveRecord::Migration[6.1]
  def change
    add_column :screening_packages, :external_product_id, :string, after: :state_exclusion_list

    ScreeningPackage.find(1).update_column(:external_product_id, "5406491000000999053")
    ScreeningPackage.find(2).update_column(:external_product_id, "5406491000000999058")
  end
end
