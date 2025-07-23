class AddStripe < ActiveRecord::Migration[6.1]
  def change
    ApiPartner.create(id: RenterInsightStripeApi::API_PARTNER_ID, name: "Stripe", partner_type: ApiPartner::TYPE_PAYMENT)
  end
end
