class HandleSubscriptionUpdate

  def self.enqueue_exception(raw_data, exception)
    Resque.enqueue_to("failure", HandleSubscriptionUpdate, raw_data, exception.message , exception.backtrace)
  end

  def self.perform(raw_data)
    subscription_details = JSON.parse(raw_data)
    subscription_details.deep_symbolize_keys!

    if subscription_details[:data] && subscription_details[:data][:subscription]
      company = Company.where(external_subscription_id: subscription_details[:data][:subscription][:subscription_id]).first

      # Maybe this is a new subscription for an existing client?
      if company.nil? && subscription_details[:data][:subscription][:customer][:zcrm_account_id].present? && RenterInsightZohoApi::SUBSCRIPTION_ACTIVE_STATUSES.include?(subscription_details[:data][:subscription][:status])
        company = Company.where(external_crm_id: subscription_details[:data][:subscription][:customer][:zcrm_account_id]).first
      end

      if company.present?
        HandleSubscriptionUpdate.update_company_subscription_data(company, subscription_details[:data][:subscription])
      end
    end

  end

  def self.update_company_subscription_data(company, subscription_data)
    if RenterInsightZohoApi::SUBSCRIPTION_ACTIVE_STATUSES.include?(subscription_data[:status])
      company.subscription_status = Company::SUBSCRIPTION_STATUS_ACTIVE
      company.deactivated_at = nil
    elsif RenterInsightZohoApi::SUBSCRIPTION_INACTIVE_STATUSES.include?(subscription_data[:status])
      company.subscription_status = Company::SUBSCRIPTION_STATUS_INACTIVE
      company.deactivated_at ||= Time.now
    elsif RenterInsightZohoApi::SUBSCRIPTION_CANCELLED_STATUSES.include?(subscription_data[:status])
      company.subscription_status = Company::SUBSCRIPTION_STATUS_CANCELLED
      company.deactivated_at ||= Time.now

      # When a company is marked as cancelled, we need to deactivate all properties
      company.deactivate_all_properties()
    end

    if subscription_data[:customer]
      company.external_crm_id = subscription_data[:customer][:zcrm_account_id] if company.external_crm_id.blank? && !subscription_data[:customer][:zcrm_account_id].blank?
      company.primary_company_admin.update({external_crm_id: subscription_data[:customer][:zcrm_contact_id]}) if company.primary_company_admin.external_crm_id.blank? && !subscription_data[:customer][:zcrm_contact_id].blank?
    end

    company.external_subscription_id = subscription_data[:subscription_id]
    company.external_subscription_customer_id = subscription_data[:customer_id]
    company.external_subscription_plan_code = subscription_data[:plan_code]

    company.save

    PushCompanyToCrm.push_data_to_crm(company)
    PushCompanyToCrm.push_data_to_subscription_customer(company)
    PushUserToCrm.push_data_to_crm(company.primary_company_admin)
  end

  def self.update_resident_subscription_data(resident, subscription_data, invoice_data)
    if RenterInsightZohoApi::SUBSCRIPTION_ACTIVE_STATUSES.include?(subscription_data[:status]) && resident.credit_builder_status != CreditReportingActivity::CREDIT_BUILDER_STATUS_ACTIVE
      resident.credit_builder_status = CreditReportingActivity::CREDIT_BUILDER_STATUS_ACTIVE

      # Did they buy the boost?
      if invoice_data[:invoice_items].present? && invoice_data[:invoice_items].find{|ii| ii[:code] == RenterInsightZohoApi::ADD_ON_CODE_CREDIT_BUILDER_BOOST && ii[:quantity] > 0}.present?
        resident.credit_builder_start_on = Date.new(2020, 1, 1) # Go way back if Boosted
      else
        resident.credit_builder_start_on = Date.today # Go back to Beginning of time if Boosted
      end

    elsif RenterInsightZohoApi::SUBSCRIPTION_INACTIVE_STATUSES.include?(subscription_data[:status])
      resident.credit_builder_status = CreditReportingActivity::CREDIT_BUILDER_STATUS_INACTIVE
    elsif RenterInsightZohoApi::SUBSCRIPTION_CANCELLED_STATUSES.include?(subscription_data[:status])
      resident.credit_builder_status = CreditReportingActivity::CREDIT_BUILDER_STATUS_INACTIVE
    end

    resident.external_subscription_id = subscription_data[:subscription_id]
    resident.save

  end


end