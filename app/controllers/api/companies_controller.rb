class Api::CompaniesController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_payments_activation_documents]

  def model_class
    Company
  end

  def show
    if !params[:id].blank? && params[:id] != "my"
      render_json({ company: Company.for_user(current_user).where(hash_id: params[:id]).first })
    else
      render_json({ company: current_user.company })
    end
  end

  def load_object_for_update()
    @object = current_user.company
  end

  def perform_search(companies)
    return companies.where("1=0") if !current_user.is_admin?

    companies = companies.where(["name like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?

    return companies
  end

  def handle_after_update
    # Check for tax reporting onboarding
    if @object.generate_1099

      if @object.tax_reporting_onboard_status == Company::TAX_REPORTING_ONBOARDING_STATUS_STARTED
        @object.tax_reporting_onboard_status = Company::TAX_REPORTING_ONBOARDING_STATUS_PENDING
        @object.save

      elsif @object.tax_reporting_onboard_status == Company::TAX_REPORTING_ONBOARDING_STATUS_PENDING && !@object.nelco_username.blank? && !@object.nelco_password.blank?
        @object.tax_reporting_onboard_status = Company::TAX_REPORTING_ONBOARDING_STATUS_COMPLETED
        @object.save
      end
    end
  end

  #
  # We are using render_successful_update to make our API calls so that we can relay errors back
  #
  def render_successful_update()

    if @object.is_activating_screening

      if ActivateForScreening.run_for_company(@object.id, current_user.id)
        super
      else
        # Now, we need to call TransUnion in order to push the landlord record
        @object.errors.add(:base, "Unable to activate screening. Please contact Renter Insight Support.")
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      super
    end
  end

  def taxpayer_info
    company_taxpayer_info = CompanyTaxpayerInfo.where(company_id: current_user.company_id).first_or_initialize
    render_json({company_taxpayer_info: company_taxpayer_info})
  end

  def save_taxpayer_info

    company_taxpayer_info = CompanyTaxpayerInfo.where(company_id: current_user.company_id).first_or_initialize
    company_taxpayer_info.assign_attributes(taxpayer_info_params())

    if company_taxpayer_info.save(validate: validate_during_save())
      current_user.company.update({payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_SUBMITTED, payments_agreement_at: Time.now, payments_agreement_ip_address: request.remote_ip})
      SystemMailer.send_taxpayer_info_to_zego(current_user.company_id).deliver
      CompanyMailer.send_to_appropriate_users(:onboarding_payments_submitted, current_user.company, current_user.company_id)
      render_json({company: current_user.company, company_taxpayer_info: company_taxpayer_info})
    else
      render_json({errors: extract_errors_by_attribute(company_taxpayer_info)}, false)
    end
  end

  def payments_activation
    @object = Company.for_user(current_user).where(id: params[:id]).first

    # We will need to do something here with Zego
    if @object.payments_onboard_status == Company::PAYMENT_ONBOARDING_STATUS_SUBMITTED
      @object.update({payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_PROPERTY_ACCOUNTS, external_payments_id: params.require(:company).permit(:external_payments_id)[:external_payments_id]})
      CompanyMailer.send_to_appropriate_users(:onboarding_payments_completed, @object, @object.id)
    end

    render_successful_update()

  end

  def save_property_bank_accounts
    @object = current_user.company

    @object.update_column(:use_same_bank_account_for_deposits, params[:use_same_bank_account_for_deposits]) if !params[:use_same_bank_account_for_deposits].nil?

    all_valid = true # Assume the best

    operating_bank_accounts = property_bank_account_params("operating_bank_accounts").collect do | bank_account_params |
      bank_account = BankAccount.where(id: bank_account_params[:id]).first if !bank_account_params[:id].blank?
      bank_account ||= BankAccount.new()
      bank_account.assign_attributes(bank_account_params)
      bank_account.company_id = current_user.company_id

      all_valid = false if !bank_account.valid?

      bank_account

    end

    if !@object.use_same_bank_account_for_deposits
      deposit_bank_accounts = property_bank_account_params("deposit_bank_accounts").collect do | bank_account_params |
        bank_account = BankAccount.where(id: bank_account_params[:id]).first if !bank_account_params[:id].blank?
        bank_account ||= BankAccount.new()
        bank_account.assign_attributes(bank_account_params)
        bank_account.company_id = current_user.company_id

        all_valid = false if !bank_account.valid?

        bank_account
      end
    else
      deposit_bank_accounts = []
    end

    if all_valid
      # Save any that aren't already in Zego
      operating_bank_accounts.each{|bank_account| bank_account.save if bank_account.external_id.blank? }
      deposit_bank_accounts.each{|bank_account| bank_account.save if bank_account.external_id.blank? }

      #
      # Now push them to Zego
      #
      @object.properties.active.each do | property |
        # Only go until Zego returns an error
        if all_valid

          error = nil

          # Are all bank accounts in Zego
          if !property.bank_accounts.select{|ba| ba.external_id.blank? }.empty?

            api = RenterInsightZegoApi.new(@object)
            add_property_result = api.admin_add_property(property)

            if add_property_result && add_property_result["Code"] && add_property_result["Code"].first == "1"
              # Look for the payee ID
              action_result = add_property_result.deep_symbolize_keys[:Action].first
              payees = ApiProcessor.read_xml_array(action_result, 'Payees/Payee')

              if payees.count >= property.bank_accounts.count
                # Match up payees by Account number and update
                payees.each do | payee |
                  payee_id = ApiProcessor.read_xml_string(payee, 'PayeeId')
                  bank_account_reference = ApiProcessor.read_xml_string(payee, 'VarName')
                  bank_account_id = bank_account_reference.split('_').last.to_i

                  if !bank_account_id.blank?
                    ba = property.bank_accounts.find{|ba| ba.id == bank_account_id}
                    ba.update_column(:external_id, payee_id) if ba.present?
                  end
                end
              else
                error = "Payment Processor did not accept accounts"
              end
            else
              error = add_property_result.is_a?(Hash) ? [add_property_result["Message"]].flatten.join(", ") : "Unknown processor error"
            end
          end

          if !error.blank?
            all_valid = false

            # Extract the error and push it onto all of this property's bank accounts

            operating_bank_account = operating_bank_accounts.find{|ba| ba.property_id == property.id}
            operating_bank_account.errors.add(:routing_number, error)

            deposit_bank_account = deposit_bank_accounts.find{|ba| ba.property_id == property.id}
            deposit_bank_account.errors.add(:routing_number, error) if deposit_bank_account.present?
          end
        end
      end
    end

    if all_valid
      @object.reload
      @object.update({payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_COMPLETED})
      render_successful_update()
    else
      render_json({errors: {operating_bank_accounts: extract_errors_by_attribute(operating_bank_accounts), deposit_bank_accounts: extract_errors_by_attribute(deposit_bank_accounts)}}, false)
    end
  end

  def payments_activation_documents
    load_object_for_update()
    render_payments_activation_documents_json()
  end

  def destroy_payments_activation_document
    load_object_for_update()
    @object.payments_activation_documents.where(id: params[:payments_activation_document_id]).purge
    render_payments_activation_documents_json()
  end

  def upload_payments_activation_documents

    load_object_for_update()

    if @object.present?
      @object.payments_activation_documents.attach(params.permit(:payments_activation_document)[:payments_activation_document])

      if @object.save
        render_payments_activation_documents_json()
      else
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    else
      render_json({errors: ["Company not found"]}, false)
    end
  end

  def save_item

    item = Item.new()
    item.company_id = current_user.company_id
    item.name = params[:name]
    item.type = params[:type]

    if item.save
      render_json({item: item}, true)
    else
      render_json({errors: extract_errors_by_attribute(item)}, false)
    end
  end


  protected

  def object_params
    cp = params.require(:company).permit(Company.public_fields + [:company_action], {bank_accounts: [BankAccount.public_fields() + [:account_number_confirmation]]})

    cp[:bank_accounts_attributes] = cp.delete(:bank_accounts) if cp[:bank_accounts].present?

    return cp
  end

  def property_bank_account_params(account_purpose)
    bap = params.permit( {account_purpose => [BankAccount.public_fields() + [:account_number_confirmation]]})
    return bap[account_purpose]
  end

  def taxpayer_info_params
    params.require(:company_taxpayer_info).permit(CompanyTaxpayerInfo.public_fields)
  end

  def render_payments_activation_documents_json
    payments_activation_documents = @object.payments_activation_documents.collect{|ip| Company.payments_activation_document_builder(ip).attributes!} if @object.present?
    render_json({ payments_activation_documents: payments_activation_documents  })
  end
end