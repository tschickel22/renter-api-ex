class ApiPartner < ApplicationRecord
  attr_encrypted :credentials, key: Rails.application.credentials.dig(:renter_insight_field_key)

  TYPE_INTERNAL = "internal"
  TYPE_CRM = "crm"
  TYPE_PAYMENT = "payment"
  TYPE_SCREENING = "screening"
  TYPE_COMMUNICATIONS = "communications"
  TYPE_INSURANCE = "insurance"
  TYPE_LISTING = "listing"
  TYPE_AFFILIATE = "affiliate"
  TYPE_TAX_REPORTING = "tax_reporting"

  def credentials_data
    return nil if self.credentials.blank?

    if @c.nil?
      @c = JSON.parse(self.credentials).deep_symbolize_keys
    end

    return @c
  end

  def credentials_data=(new_credentials)
    self.credentials = new_credentials.to_json
  end
end
