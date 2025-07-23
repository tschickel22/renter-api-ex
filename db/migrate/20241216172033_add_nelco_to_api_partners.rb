class AddNelcoToApiPartners < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightNelcoApi::API_PARTNER_ID, name: "Nelco", partner_type: ApiPartner::TYPE_TAX_REPORTING)
  end
end
