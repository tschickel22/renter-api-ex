class AddTwilio < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightTwilioApi::API_PARTNER_ID, name: "Twilio", partner_type: ApiPartner::TYPE_COMMUNICATIONS)
  end
end
