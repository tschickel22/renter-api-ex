class DepositItem < ApplicationRecord
  belongs_to :deposit
  belongs_to :payment
end
