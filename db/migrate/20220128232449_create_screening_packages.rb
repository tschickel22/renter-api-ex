class CreateScreeningPackages < ActiveRecord::Migration[6.1]
  def change
    create_table :screening_packages do |t|
      t.string :name
      t.decimal :amount, precision: 5, scale: 2
      t.boolean :has_credit_score
      t.boolean :has_criminal_report
      t.boolean :has_full_credit_report
      t.boolean :has_eviction_report
      t.boolean :has_income_report
      t.string :external_screening_id

      t.timestamps
    end

    ScreeningPackage.create(name: "Renter Insight Premium", amount: 40, has_credit_score: true, has_criminal_report: true, has_full_credit_report: true, has_eviction_report: true, has_income_report: true, external_screening_id: 3)
    ScreeningPackage.create(name: "Renter Insight Plus", amount: 38, has_credit_score: true, has_criminal_report: true, has_full_credit_report: true, has_eviction_report: true, has_income_report: false, external_screening_id: 3)
  end
end
