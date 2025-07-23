class ResidentPaymentMethod < PaymentMethod

  belongs_to :resident
  validates :resident_id, presence: true

  def self.ensure_cash_method(lease_resident)
    existing_method = lease_resident.resident.resident_payment_methods.where(method: PaymentMethod::METHOD_CASH).first_or_initialize

    if existing_method.new_record?
      existing_method.populate_for_cash(lease_resident.resident)

      api = RenterInsightZegoApi.new(lease_resident.lease.company)

      if api.create_or_update_account(existing_method, :external_id)
        existing_method.update(external_id: api.read_cash_card_number)
      end
    end

    return existing_method
  end

  def populate_for_cash(resident)
    self.nickname = "Cash Pay"
    self.billing_first_name = resident.first_name
    self.billing_last_name = resident.last_name
  end

  def self.for_user(current_user)
    ResidentPaymentMethod.where(resident_id: current_user.resident.id)
  end

  def generate_reference_id
    return "#{self.class.to_s}:#{self.resident.hash_id}"
  end
end
