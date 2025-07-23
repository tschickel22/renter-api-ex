# Worker that handles daily billing of envelope charges for companies
class BillEnvelopeChargesForTheDay
  include ApplicationHelper

  def self.perform
    Rails.logger.info("START #{self.to_s}: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %Z')}")

    unbilled_documents_by_company.each do |company_id, external_documents|
      next if company_id.nil?

      company = Company.find(company_id)
      next unless company.present?

      Rails.logger.error('Could not create add-on because company.external_subscription_id is blank') unless company.external_subscription_id.present?
      next unless company.external_subscription_id.present?

      begin
        bill_company(company, external_documents.length)
        external_documents.each do |external_document|
          external_document.update(has_been_billed_at: Time.now)
        end
      rescue => e
        Rails.logger.error("Error billing company #{company.id}: #{e.message}")
      end
    end
  end

  def self.unbilled_documents
    ExternalDocument.where(should_be_billed: true, has_been_billed_at: nil)
  end

  def self.unbilled_documents_by_company
    unbilled_documents.group_by(&:company_id)
  end

  def self.bill_company(company, quantity)
    description = 'RI eSignature Envelope'
    code = RenterInsightZohoApi::ADD_ON_CODE_DOCUMENT_SIGNING
    RenterInsightZohoApi.new.add_one_time_add_on(company.external_subscription_id, code, quantity, description)
  end
end
