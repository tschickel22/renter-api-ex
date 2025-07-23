class AddTransUnionApiPartner < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightTransUnionApi::API_PARTNER_ID, name: "TransUnion", partner_type: ApiPartner::TYPE_SCREENING)
  end
end
