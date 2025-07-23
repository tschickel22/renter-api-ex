class AddDewllsyToLeadSources < ActiveRecord::Migration[6.1]
  def change
    LeadSource.create(name: "Dwellsy")
  end
end
