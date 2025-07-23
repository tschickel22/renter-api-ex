class AddThreeLeadSources < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightRentalSourceApi::API_PARTNER_ID, name: "Rental Source", partner_type: ApiPartner::TYPE_LISTING)
    LeadSource.create(name: LeadSource::NAME_RENTAL_SOURCE)

    ApiPartner.create(id: RenterInsightZillowApi::API_PARTNER_ID, name: "Zillow", partner_type: ApiPartner::TYPE_LISTING)
    LeadSource.create(name: LeadSource::NAME_ZILLOW)

    ApiPartner.create(id: RenterInsightZumperApi::API_PARTNER_ID, name: "Zumper", partner_type: ApiPartner::TYPE_LISTING)
    LeadSource.create(name: LeadSource::NAME_ZUMPER)
  end
end
