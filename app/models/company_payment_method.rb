class CompanyPaymentMethod < PaymentMethod
  validates :company_id, presence: true

  def generate_reference_id
    return "#{self.class.to_s}:#{self.company_id}"
  end

  def self.primary_account(company_id)
    # Grab the ACH account if available... otherwise, debit, credit is fine
    CompanyPaymentMethod.where(company_id: company_id, method: PaymentMethod::METHOD_ACH).first ||
    CompanyPaymentMethod.where(company_id: company_id, method: PaymentMethod::METHOD_DEBIT_CARD).first ||
    CompanyPaymentMethod.where(company_id: company_id).first
  end
end