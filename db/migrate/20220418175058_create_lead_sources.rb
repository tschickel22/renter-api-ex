class CreateLeadSources < ActiveRecord::Migration[6.1]
  def change
    create_table :lead_sources do |t|
      t.string :name

      t.timestamps
      t.datetime :deleted_at
    end

    LeadSource.create(name: "Apartments.com")
    LeadSource.create(name: "Craigslist")
    LeadSource.create(name: "Zillow")

  end
end
