class ChargeCompanyForNsf
  include ApplicationHelper

  def self.enqueue(payment_return_id)
    Resque.enqueue_to("billing", ChargeCompanyForNsf, payment_return_id)
  end

  def self.perform(payment_return_id)

    Rails.logger.error("START #{self.to_s}: #{payment_return_id}")
    payment_return = PaymentReturn.find(payment_return_id)

    # Keeping both methods around as a test...
    description = "NSF added for ##{payment_return.hash_id} #{payment_return.lease.property_and_unit} #{payment_return.lease.primary_resident&.resident&.full_name}"

    if !payment_return.company.external_subscription_id.blank?
      RenterInsightZohoApi.new.add_one_time_add_on(payment_return.company.external_subscription_id, RenterInsightZohoApi::ADD_ON_CODE_NSF, 1, description)
    else
      raise "Could not create add-on because company.external_subscription_id is blank"
    end

  end
end