module ApplicationHelper
  require 'digest/sha1'

  # This allows cleaner integration with Formik
  def extract_errors_by_attribute(object)
    errors_by_attr = {}

    if object.is_a?(Array)
      object.each_with_index do | obj, index |
        errors_by_attr[index] = extract_errors_by_attribute(obj)
      end
    else

      object.errors.errors.each do | e |

        # Need model[index].field
        attribute = e.attribute.to_s

        if attribute.include?('[')
          model = attribute.split('[').first
          field = attribute.split('].').last
          index = attribute.split('[').second.split('].').first

          addition = parse_dot_notation(model, {index => parse_dot_notation(field, e.message)})

          errors_by_attr = errors_by_attr.deep_merge(addition)

        elsif attribute.include?('.')
          errors_by_attr = errors_by_attr.deep_merge(parse_dot_notation(attribute, e.message))
        else
          errors_by_attr[attribute] = e.message
        end
      end
    end

    return errors_by_attr
  end

  def parse_dot_notation(attribute, message)
    addition = message
    attribute.split('.').reverse.each do | part |
      addition = {part => addition}
    end

    return addition
  end

  def parse_number_param(params, param_names)
    param_names = [param_names] unless param_names.is_a?(Array)
    param_names.each do |param_name|
      next if params[param_name].blank?

      begin
        params[param_name] = params[param_name].to_s.gsub(/,/, '').gsub(/\$/, '').gsub(/\%/, '')
      rescue
        Rails.logger.error("Error parsing number #{param_name}")
        params[param_name] = nil
      end

    end

    return params
  end

  # Handle inbound date times as mm/dd/yyyy
  def parse_mmddyy_param(params, param_names)
    param_names = [param_names] unless param_names.is_a?(Array)
    param_names.each do |param_name|
      next if params[param_name].blank? || params[param_name].is_a?(Date)

      begin
        if params[param_name].strip.include?(' ')
          params[param_name] = Time.strptime(params[param_name], '%m/%d/%Y %H:%M')
        else

          if params[param_name].include?('T') && params[param_name].include?('Z')
            params[param_name] = Time.strptime(params[param_name], '%Y-%m-%dT%H:%M')

          # Try to intelligently cope with 1/1/79 -vs- 01/01/1979
          elsif params[param_name].split('/').count == 3 && params[param_name].split('/').last.length == 2
            params[param_name] = Time.strptime(params[param_name], '%m/%d/%y')

            # Try to intelligently cope with 01171975
          elsif params[param_name].split('/').count == 1 && params[param_name].length == 8 && params[param_name].slice(0,2).to_i <= 12
            params[param_name] = Time.strptime(params[param_name], '%m%d%Y')

            # Try to intelligently cope with 011775
          elsif params[param_name].split('/').count == 1 && params[param_name].length == 6 && params[param_name].slice(-2,2).to_i > 31
            params[param_name] = Time.strptime(params[param_name].slice(0, 4) + '19' + params[param_name].slice(4,6), '%m%d%Y')

          else
            params[param_name] = Time.strptime(params[param_name], '%m/%d/%Y')
          end

        end
      rescue
        Rails.logger.error("Error parsing date #{param_name}")
        params[param_name] = nil
      end

    end

    return params
  end

  def parse_mmyy_param(params, param_name)
    begin
      if params[param_name].length < 6
        params[param_name] = Date.strptime(params[param_name], '%m/%y')
      else
        params[param_name] = Date.strptime(params[param_name], '%m/%Y')
      end

      # Go to the end of the month
      params[param_name] = params[param_name].end_of_month

    rescue
      params[param_name] = nil
    end
  end

  def build_data_package()
    data = {railsEnv: Rails.env, constants: build_constants(), settingsConfig: Setting.config_with_usage(), settings: Setting.for_user(current_user)}

    data[:offerInsurance] = !Rails.env.production? || (current_user.present? && current_user.company_id == 2000)
    data[:baseUrl] = SystemMailer.base_url
    data[:leadSources] = LeadSource.all.collect{|ls| ls.to_builder.attributes!}
    data[:chargeTypes] = ChargeType.all.collect{|ct| ct.to_builder.attributes!}
    data[:accountCategories] = AccountCategory.for_user(current_user).includes(:parent_account_category).order(:order_number).collect{|ct| ct.to_builder("full").attributes!}
    data[:items] = Item.for_user(current_user).order(:order_number).collect{|ct| ct.to_builder.attributes!}

    return data
  end

  def build_constants()
    constants = {}

    constants[:user_types] = to_key_values(User::TYPE_OPTIONS)
    constants[:ownership_types] = to_key_values(Property::OWNERSHIP_TYPE_OPTIONS)
    constants[:lease_resident_steps] = to_key_values(LeaseResident::STEP_OPTIONS)
    constants[:lease_resident_types] = to_key_values(LeaseResident::TYPE_OPTIONS)
    constants[:lease_resident_move_out_intentions] = to_key_values(LeaseResident::MOVE_OUT_INTENTION_OPTIONS)
    constants[:employment_statuses] = to_key_values(ResidentEmploymentHistory::EMPLOYMENT_STATUS_OPTIONS)
    constants[:times_at_company] =  to_key_values(ResidentEmploymentHistory::TIME_AT_OPTIONS)
    constants[:times_at_address] =  to_key_values(ResidentEmploymentHistory::TIME_AT_OPTIONS)
    constants[:residence_types] = to_key_values(ResidentResidenceHistory::RESIDENCE_TYPE_OPTIONS)
    constants[:emergency_relationship_types] = to_key_values(ResidentContactEmergency::RELATIONSHIP_TYPE_OPTIONS)
    constants[:reference_relationship_types] = to_key_values(ResidentContactReference::RELATIONSHIP_TYPE_OPTIONS)
    constants[:pet_types] = to_key_values(ResidentPet::PET_TYPE_OPTIONS)
    constants[:suffixes] = to_key_values(Resident::SUFFIX_OPTIONS)
    constants[:id_types] = to_key_values(Resident::ID_TYPE_OPTIONS)
    constants[:payment_methods] = to_key_values(PaymentMethod::METHOD_OPTIONS)
    constants[:lease_actions] = to_key_values(Lease::ACTION_OPTIONS)
    constants[:lease_statuses] = to_key_values(Lease::STATUS_OPTIONS)
    constants[:lease_refund_modes] = to_key_values(Lease::REFUND_MODE_OPTIONS)
    constants[:lease_term_options]= to_key_values(Lease::TERM_OPTIONS)
    constants[:lease_application_statuses] = to_key_values(Lease::APPLICATION_STATUS_OPTIONS)
    constants[:lease_move_out_steps] = to_key_values(Lease::MOVE_OUT_STEP_OPTIONS)
    constants[:external_screening_statuses] = to_key_values(RenterInsightTransUnionApi::SCREENING_STATUS_OPTIONS)
    constants[:credit_levels] = to_key_values(LeaseResident::CREDIT_LEVEL_OPTIONS)
    constants[:charge_frequencies] = to_key_values(Charge::FREQUENCY_OPTIONS)
    constants[:payment_statuses] = to_key_values(Payment::STATUS_OPTIONS)
    constants[:expense_payment_statuses] = to_key_values(ExpensePayment::STATUS_OPTIONS)
    constants[:payment_onboarding_statuses]= to_key_values(Company::PAYMENT_ONBOARDING_STATUS_OPTIONS)
    constants[:financial_connections_onboarding_statuses]= to_key_values(Company::FINANCIAL_CONNECTIONS_ONBOARDING_STATUS_OPTIONS)
    constants[:tax_reporting_onboard_statuses]= to_key_values(Company::TAX_REPORTING_ONBOARDING_STATUS_OPTIONS)
    constants[:tax_classification_options]= to_key_values(CompanyTaxpayerInfo::TAX_CLASSIFICATION_OPTIONS)
    constants[:subscription_frequencies] = to_key_values(Company::SUBSCRIPTION_FREQUENCY_OPTIONS)
    constants[:subscription_pricing] = to_key_values(Company::SUBSCRIPTION_PRICING_OPTIONS)
    constants[:subscription_statuses] = to_key_values(Company::SUBSCRIPTION_STATUS_OPTIONS)
    constants[:recurring_payment_frequencies] = to_key_values(LeaseResident::RECURRING_PAYMENT_FREQUENCY_OPTIONS)
    constants[:maintenance_request_statuses] = to_key_values(MaintenanceRequest::STATUS_OPTIONS)
    constants[:maintenance_request_urgencies] = to_key_values(MaintenanceRequest::URGENCY_OPTIONS)
    constants[:maintenance_request_resolution_times] = to_key_values(MaintenanceRequest::RESOLUTION_TIME_OPTIONS)
    constants[:maintenance_request_recurring_frequencies] = to_key_values(MaintenanceRequest::RECURRING_FREQUENCY_OPTIONS)
    constants[:vendor_statuses] = to_key_values(Vendor::STATUS_OPTIONS)
    constants[:bank_account_types] = to_key_values(BankAccount::ACCOUNT_TYPE_OPTIONS)
    constants[:journal_entry_frequencies] = to_key_values(JournalEntry::FREQUENCY_OPTIONS)
    constants[:account_protected_codes] = Account::PROTECTED_CODES
    constants[:pets_allowed_options] = to_key_values(PropertyListing::PETS_ALLOWED_OPTIONS)
    constants[:laundry_type_options] = to_key_values(PropertyListing::LAUNDRY_TYPE_OPTIONS)
    constants[:parking_type_options] = to_key_values(PropertyListing::PARKING_TYPE_OPTIONS)
    constants[:amenity_options] = to_key_values(PropertyListing::AMENITY_OPTIONS)
    constants[:utility_options] = to_key_values(PropertyListing::UTILITY_OPTIONS)
    constants[:unit_feature_amenity_options] = to_key_values(UnitListing::FEATURE_AMENITY_OPTIONS)
    constants[:unit_kitchen_amenity_options] = to_key_values(UnitListing::KITCHEN_AMENITY_OPTIONS)
    constants[:unit_outdoor_amenity_options] = to_key_values(UnitListing::OUTDOOR_AMENITY_OPTIONS)
    constants[:unit_living_space_amenity_options] = to_key_values(UnitListing::LIVING_SPACE_AMENITY_OPTIONS)
    constants[:unit_listing_type_options] = to_key_values(UnitListing::LISTING_TYPE_OPTIONS)
    constants[:unit_listing_statuses] = to_key_values(UnitListing::STATUS_OPTIONS)
    constants[:user_role_access_level_options] = to_key_values(UserRole::ACCESS_LEVEL_OPTIONS)
    constants[:property_owner_type_options] = to_key_values(PropertyOwner::OWNER_TYPE_OPTIONS)
    constants[:account_reconciliation_status_options] = to_key_values(AccountReconciliation::STATUS_OPTIONS)
    constants[:credit_builder_status_options] = to_key_values(CreditReportingActivity::CREDIT_BUILDER_STATUS_OPTIONS)
    constants[:bank_transaction_status_options] = to_key_values(BankTransaction::STATUS_OPTIONS)
    constants[:zoho_upgrade_plan_codes] = {monthly: RenterInsightZohoApi::PLAN_CODE_MONTHLY_UPGRADE, yearly: RenterInsightZohoApi::PLAN_CODE_YEARLY_UPGRADE}
    constants[:tax_reporting_current_year] = TaxReporting.current_report_year
    constants[:tax_reporting_years] = TaxReporting.years()

    constants[:env] = gather_environment_variables()

    return constants
  end

  def gather_environment_variables
    environment_variables = {}

    environment_variables[:msi_registration_url] = Rails.application.credentials.dig(:msi, :registration_url)
    environment_variables[:msi_pay_now_url] = Rails.application.credentials.dig(:msi, :pay_now_url)
    environment_variables[:msi_file_claim_url] = Rails.application.credentials.dig(:msi, :file_claim_url)
    environment_variables[:msi_manage_policy_url] = Rails.application.credentials.dig(:msi, :manage_policy_url)
    environment_variables[:msi_phone_number] = Rails.application.credentials.dig(:msi, :phone_number)

    environment_variables[:zoho_sso_url] = Rails.application.credentials.dig(:zoho, :sso_url)
    environment_variables[:zoho_registration_free_url] = Rails.application.credentials.dig(:zoho, :registration_free_url)
    environment_variables[:zoho_registration_monthly_url] = Rails.application.credentials.dig(:zoho, :registration_monthly_url)
    environment_variables[:zoho_registration_yearly_url] = Rails.application.credentials.dig(:zoho, :registration_yearly_url)
    environment_variables[:zoho_renter_credit_builder_url] = Rails.application.credentials.dig(:zoho, :renter_credit_builder_url)

    environment_variables[:insurance_api_partner_internal] = RenterInsightInternalApi::API_PARTNER_ID
    environment_variables[:insurance_api_partner_msi] = RenterInsightMsiApi::API_PARTNER_ID

    environment_variables[:google_api_key] = Rails.application.credentials.dig(:google, :api_key)

    environment_variables[:stripe_public_key] = Rails.application.credentials.dig(:stripe, :public_key)

    environment_variables[:nelco_url] = Rails.application.credentials.dig(:nelco, :url)

    return environment_variables
  end

  def to_key_values(hash)
    hash.inject({}) { | acc, parts|  acc[parts.first] = {key: parts.first, value: parts.last} ; acc}
  end

  def label_lookup(value, options)
    return nil if value.nil? || options.empty?

    if options.is_a?(Hash)
      return options[value] if options.keys.include?(value)
      return options[value.to_sym] if options.keys.include?(value.to_sym)
    end

    selected_option = options.find{|o| o[1] == value }

    return selected_option[0] unless selected_option.nil?
    return value.titleize

  end

  #
  # Users & Proxying
  #
  def proxied_in?
    !!current_proxy_user
  end

  def current_proxy_user
    @current_proxy_user ||= login_proxy_from_session unless @current_proxy_user == false
  end

  # Store the given user id in the session.
  def current_proxy_user=(new_user)
    session[:proxy_user_id] = new_user ? new_user.id : nil

    @current_proxy_user = new_user || false
  end

  def login_proxy_from_session
    self.current_proxy_user = User.find_by_id(session[:proxy_user_id]) if session[:proxy_user_id]
  end

  def current_actual_user
    return current_proxy_user || current_user
  end

  def todays_date
    DateTime.now.in_time_zone('US/Mountain').to_date
  end

  def render_attachment_json(field_name, attachment)
    if attachment.present?
      json_obj = Jbuilder.new do |json|
        json.id attachment.id
        json.filename attachment.filename.to_s
        json.content_type attachment.content_type
        json.url Rails.application.routes.url_helpers.url_for(attachment)
      end

      render json: {field_name => json_obj.attributes!}.merge({success: true})
    else
      render json: {field_name => nil, success: true}
    end
  end

  def check_for_removals(new_has_many_params, existing_has_many)
    if existing_has_many.present? && new_has_many_params.present?
      existing_has_many.each do | has_many_record |
        if new_has_many_params.find{|p| p[:id] == has_many_record.id}.nil?
          new_has_many_params << {id: has_many_record.id, _destroy: '1'}
        end
      end
    end
  end
end
