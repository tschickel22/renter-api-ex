class ParanoidRecord < ApplicationRecord
  self.abstract_class = true
  default_scope {where(:deleted_at => nil)}

  def destroy
    self.update_attribute(:deleted_at, Time.now) if self.deleted_at.nil?
  end

  def force_destroy
    self.public_method(:destroy).super_method.call
  end
end
