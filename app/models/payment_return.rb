class PaymentReturn < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::Expense"}
  before_create :generate_hash
  belongs_to :payment
  belongs_to :payment_method
  belongs_to :lease
  belongs_to :company
  belongs_to :property

  validates :company_id, presence: true
  validates :property_id, presence: true
  validates :lease_id, presence: true
  validates :amount, presence: true, numericality: {greater_than: 0}

  def is_manual?
    payment.present? && payment.status == Payment::STATUS_MANUAL
  end

  def status
    payment.status
  end

  def description_pretty
    "Payment Return ##{hash_id}"
  end

  def self.return_amount(payment, amount, payment_error_message)
    if payment.payment_return.present?
      return nil
    else
      payment_return = PaymentReturn.new(
        {
          company_id: payment.company_id,
          property_id: payment.property_id,
          lease_id: payment.lease_id,
          resident_id: payment.resident_id,
          payment_id: payment.id,
          payment_at: Time.now,
          amount: amount,
          fee: payment.fee,
          fee_responsibility: payment.fee_responsibility,
          return_reason: payment_error_message
        })

      if payment_return.save

        if payment.lease.present?
          settings = payment.lease.settings

          # Update the ledger
          AccountingService.push_to_ledger(payment_return)

          #
          # NSF HANDLING
          #
          if payment_return.is_nsf?
            # Generate Late Fee (if applicable)
            if settings.charge_residents_late_rent_fee && settings.charge_residents_nsf_and_late_fee
              AccountingService.generate_late_fee(payment.lease)
            end

            # Generate NSF Fee
            AccountingService.generate_nsf(payment.lease)

            ChargeCompanyForNsf.enqueue(payment_return.id)
          end
        end

        return payment_return
      else
        return nil
      end
    end
  end

  def is_nsf?
    ['NSF'].include?(return_reason) || ['R01'].include?(return_code)
  end

  def self.public_fields
    []
  end

  def self.private_fields
    [:id, :hash_id, :amount, :return_reason, :payment_at]
  end

  def to_builder()
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