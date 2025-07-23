class AddPetRent < ActiveRecord::Migration[6.1]
  def change
    ChargeType.create(id: ChargeType::PET_RENT, name: 'Pet Rent', account_code: 414)
  end
end
