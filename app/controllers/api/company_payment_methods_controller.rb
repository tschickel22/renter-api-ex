class Api::CompanyPaymentMethodsController < Api::ApiController

  def model_class
    CompanyPaymentMethod
  end

  def create
    @object = setup_new_object()

    @object.assign_attributes(object_params)
    @object.api_partner_id = RenterInsightZegoApi::API_PARTNER_ID

    if @object.valid?

      api = RenterInsightZegoApi.new()

      begin
        if api.create_or_update_account(@object, :external_id, request)
          @object.external_id = api.read_gateway_payer_id
          @object.save
        else
          render_json({errors: {base: api.payment_error_message || "Payment processor error. Please try again."}}, false)
          return
        end
      rescue
        Rails.logger.error($!.message)
        Rails.logger.error($!.backtrace.join("\n"))
        render_json({errors: {base: "Unknown payment processor error. Please try again."}}, false)
        return
      end

      render_successful_create()

    else
      render_json({errors: extract_errors_by_attribute(@object)}, false)
    end
  end

  protected

  def object_params
    pp = params.require(:company_payment_method).permit(CompanyPaymentMethod.public_fields() + CompanyPaymentMethod.transient_fields()) || {}
    pp = handle_company_payment_method(pp)

    return pp
  end

  def handle_company_payment_method(permitted_params)

    # Handle the Billing Agreement
    if !permitted_params[:billing_agreement].blank? && @object.billing_agreement_at.nil?
      permitted_params[:billing_agreement_at] = Time.now
      permitted_params[:billing_agreement_ip_address] = request.remote_ip
    end

    # Handle the expiration date
    parse_mmyy_param(permitted_params, :credit_card_expires_on)

    # Grab the last four digits of the account or credit card number for ease-of-display
    if permitted_params[:method] == PaymentMethod::METHOD_CREDIT_CARD
      permitted_params[:last_four] = permitted_params[:credit_card_number].slice(-4, 4) if !permitted_params[:credit_card_number].blank?
      permitted_params[:nickname] = "Credit Card ending in #{permitted_params[:last_four]}" if permitted_params[:nickname].blank?
    end

    if permitted_params[:method] == PaymentMethod::METHOD_DEBIT_CARD
      permitted_params[:last_four] = permitted_params[:credit_card_number].slice(-4, 4) if !permitted_params[:credit_card_number].blank?
      permitted_params[:nickname] = "Debit Card ending in #{permitted_params[:last_four]}" if permitted_params[:nickname].blank?
    end

    if permitted_params[:method] == PaymentMethod::METHOD_ACH
      permitted_params[:last_four] = permitted_params[:ach_account_number].slice(-4, 4) if !permitted_params[:ach_account_number].blank?
      permitted_params[:nickname] = "Account ending in #{permitted_params[:last_four]}" if permitted_params[:nickname].blank?
    end

    return permitted_params
  end
end