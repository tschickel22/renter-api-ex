class ScreeningRequest < ApplicationRecord
  belongs_to :company
  belongs_to :property
  belongs_to :lease
  belongs_to :lease_resident
end
