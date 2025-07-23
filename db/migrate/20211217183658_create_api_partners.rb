class CreateApiPartners < ActiveRecord::Migration[6.1]
  def change
    create_table :api_partners, id: :integer, default: nil, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
      t.string :name
      t.string :partner_type
      t.timestamps
    end

    ApiPartner.create(id: RenterInsightInternalApi::API_PARTNER_ID, name: "Internal", partner_type: ApiPartner::TYPE_INTERNAL)
    ApiPartner.create(id: RenterInsightZegoApi::API_PARTNER_ID, name: "Zego", partner_type: ApiPartner::TYPE_PAYMENT)
  end
end
