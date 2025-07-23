class RemoveRenterInsightBasic < ActiveRecord::Migration[6.1]
  def change
    ScreeningPackage.find(3).destroy
    ScreeningPackage.find(2).update({has_eviction_report: false})
    ScreeningPackage.find(1).update({has_income_report: false})
  end
end
