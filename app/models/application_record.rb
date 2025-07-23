class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  def generate_long_hash
    generate_hash(true)
  end

  def generate_hash(long = false)

    # During large imports or integration pulls, we can run into duplicate key issues
    if self.hash_id.blank?
      i = 0
      new_hash_id = nil
      while i < 5 && new_hash_id.nil?
        i += 1
        new_hash_id = SecureRandom.random_number.to_s.reverse[0..7]
        new_hash_id += SecureRandom.random_number.to_s.reverse[0..7] if long

        if new_hash_id.include?('-e')
          new_hash_id = nil
        elsif self.class.unscoped.where(hash_id: new_hash_id).exists? # Reject it if it exists as a debt
          new_hash_id = nil
        end
      end

      self.hash_id = new_hash_id || 'duplicate_failure'
    end
  end

  def ensure_decimals(amount)
    if amount.present? && amount.is_a?(BigDecimal)
      "%.2f" % amount
    else
      amount
    end
  end

  def to_builder
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end
    end
  end
end
