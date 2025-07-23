class AddMsiToApiPartners < ActiveRecord::Migration[6.1]
  def change

    ApiPartner.create(id: RenterInsightMsiApi::API_PARTNER_ID, name: "MSI", partner_type: ApiPartner::TYPE_INSURANCE)
  end
end
