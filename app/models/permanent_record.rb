class PermanentRecord < ApplicationRecord
  self.abstract_class = true

  def destroy
    # Cannot be deleted
  end

  def force_destroy
    self.public_method(:destroy).super_method.call
  end
end
