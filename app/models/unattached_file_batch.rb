class UnattachedFileBatch < ApplicationRecord
  has_many_attached :files
end
