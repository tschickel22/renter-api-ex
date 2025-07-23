class AddDwellsyToApiPartners < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightDwellsyApi::API_PARTNER_ID, name: "Dwellsy", partner_type: ApiPartner::TYPE_LISTING)
  end
end
