include WorkerHelper

class PushCompanyToCrm
  def self.enqueue(company_id)
    Resque.enqueue_to("crm", self, company_id)
  end

  def self.perform(company_id = nil)
    if company_id.nil?
      Company.where("LENGTH(companies.external_crm_id) > 0 AND companies.updated_at > now() - INTERVAL 1 DAY").each do | company |
        if !Rails.env.development?
          PushCompanyToCrm.enqueue(company.id)
        end
      end
    else
      PushCompanyToCrm.push_data_to_crm(Company.find(company_id))
    end
  end

  def self.push_data_to_crm(company)

    # Total up how many units we have in our system
    actual_number_of_units = company.properties.active.inject(0) {|sum, property| sum + property.units.count}

    crm_data = {
      Account_Name: company.name,
      Phone: company.primary_company_admin.cell_phone,
      Company_Total_Units: actual_number_of_units,
      Units_at_Enrollment: company.number_of_units
    }

    if !company.primary_company_admin.confirmation_token.blank?
      crm_data[:RI_Create_Account_Link] = SystemMailer.base_url + "/users/confirmation?confirmation_token=#{company.primary_company_admin.confirmation_token}"
    end

    if company.external_crm_id.blank?
      result = RenterInsightZohoApi.new.create_account(crm_data)

      # Stash the ID
      company.external_crm_id = result[:data].first[:details][:id]
      company.save(validate: false)
    else
      RenterInsightZohoApi.new.update_account(company.external_crm_id, crm_data)
    end

    PushCompanyToCrm.ensure_correct_company_add_ons(company)
  end

  def self.push_data_to_subscription_customer(company)
    if !company.external_subscription_customer_id.blank?
      customer_data = {
        company_name: company.name,
        display_name: company.name,
        first_name: company.primary_company_admin.first_name,
        last_name: company.primary_company_admin.last_name,
      }
      customer_data[:phone] = company.primary_company_admin.cell_phone if !company.primary_company_admin.cell_phone.blank?
      RenterInsightZohoApi.new.update_subscription_customer(company.external_subscription_customer_id, customer_data)
    end
  end

  def self.ensure_correct_property_add_ons(company)
    actual_number_of_units = company.properties.active.inject(0) {|sum, property| sum + property.units.count}

    if !company.external_subscription_id.blank?
      existing_subscription = RenterInsightZohoApi.new.get_subscription(company.external_subscription_id)

      if actual_number_of_units > Company::FREE_UNIT_THRESHOLD

        interval_unit = existing_subscription[:subscription][:interval_unit] == "years" ? "yearly" : "monthly"

        add_on = RenterInsightZohoApi.new.get_add_on_for_product_id(ApiProcessor.read_xml_value(existing_subscription, "subscription/product_id"), interval_unit)

        if add_on.present?
          # Is there anything to update?
          existing_add_on = ApiProcessor.read_xml_array(existing_subscription, 'subscription/addons').find{|ao| ao[:addon_code] == add_on[:addon_code]}

          if existing_add_on.nil? || existing_add_on[:quantity] != actual_number_of_units - Company::FREE_UNIT_THRESHOLD
            RenterInsightZohoApi.new.update_subscription_add_ons(company.external_subscription_id, add_on[:addon_code], actual_number_of_units - Company::FREE_UNIT_THRESHOLD)
          end
        end

        # Under the threshold now, remove any existing add_ons
      elsif existing_subscription[:subscription][:addons] && existing_subscription[:subscription][:addons].length > 0
        RenterInsightZohoApi.new.update_subscription_add_ons(company.external_subscription_id, nil, 0)
      end
    end
  end

  def self.ensure_correct_company_add_ons(company)
    if !company.external_subscription_id.blank?
      if company.financial_connections_onboard_status == Company::FINANCIAL_CONNECTIONS_ONBOARDING_STATUS_COMPLETED

        # Check for this add on
        existing_subscription = RenterInsightZohoApi.new.get_subscription(company.external_subscription_id)
        existing_add_on = existing_subscription[:subscription][:addons].find{|z| z[:addon_code] == RenterInsightZohoApi::ADD_ON_CODE_FINANCIAL_CONNECTIONS}

        if existing_add_on.nil? || existing_add_on[:quantity] < 1
          RenterInsightZohoApi.new.update_subscription_add_ons(company.external_subscription_id, RenterInsightZohoApi::ADD_ON_CODE_FINANCIAL_CONNECTIONS, 1)
        end

        uncharged_accounts = BankAccount.where(company_id: company.id).where.not(external_stripe_id: nil).where(charged_for_connection_at: nil)

        # Call Zoho to charge for this
        if uncharged_accounts.count > 0
          if RenterInsightZohoApi.new.add_one_time_add_on(company.external_subscription_id, RenterInsightZohoApi::ADD_ON_CODE_FINANCIAL_CONNECTIONS_PER_ACCOUNT, uncharged_accounts.count, "Financial Connections: #{uncharged_accounts.count} #{"account".pluralize(uncharged_accounts.count)} added")
            uncharged_accounts.each do | bank_account |
              bank_account.charged_for_connection_at = Time.now
              bank_account.save(validate: false)
            end
          end
        end
      end
    end
  end
end