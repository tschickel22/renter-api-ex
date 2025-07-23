class AddZohoApiPartner < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightZohoApi::API_PARTNER_ID, name: "Zoho", partner_type: ApiPartner::TYPE_CRM)
  end
end
