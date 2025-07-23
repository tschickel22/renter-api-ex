class AddImpactToApiPartners < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightImpactApi::API_PARTNER_ID, name: "Impact", partner_type: ApiPartner::TYPE_AFFILIATE)
  end
end
