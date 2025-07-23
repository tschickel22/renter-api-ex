class UnitListingPhoto < ApplicationRecord
  has_one_attached :photo
  has_many :unit_listing_photo_units
end
