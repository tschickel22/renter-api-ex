class AddRentToApiPartners < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightRentApi::API_PARTNER_ID, name: "Rent.com", partner_type: ApiPartner::TYPE_LISTING)
    LeadSource.create(name: LeadSource::NAME_RENT)
  end
end
