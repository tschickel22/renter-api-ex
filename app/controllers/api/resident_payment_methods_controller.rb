class Api::ResidentPaymentMethodsController < Api::ApiController

  def model_class
    ResidentPaymentMethod
  end

  def primary_key_field
    :hash_id
  end

  def show
    super
  end

  def validate_during_save
    @object.id.nil? # Validate only on create
  end

  def search
    if !params[:lease_resident_id].blank?
      lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
      resident_payment_methods = ResidentPaymentMethod.where(resident_id: lease_resident.resident_id)

      render_json({resident_payment_methods: resident_payment_methods}, true)
    elsif current_user.is_resident?
      resident_payment_methods = ResidentPaymentMethod.where(resident_id: current_user.resident.id)

      render_json({resident_payment_methods: resident_payment_methods}, true)
    end
  end

  def create
    @object = setup_new_object()

    if !params[:lease_resident_id].blank?
      lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
      @object.resident_id = lease_resident.resident_id
    end

    @object.assign_attributes(object_params)

    if @object.is_cash?
      @object.populate_for_cash(@object.resident)
    end

    @object.api_partner_id = RenterInsightZegoApi::API_PARTNER_ID

    if @object.valid?

      api = RenterInsightZegoApi.new(lease_resident.present? ? lease_resident.lease.company : nil)

      begin
        if api.create_or_update_account(@object, :external_id, request)

          if @object.is_cash?
            @object.external_id = api.read_cash_card_number
          else
            @object.external_id = api.read_gateway_payer_id
          end

          @object.save

          # If the lease_resident applicant, add this account to the Renter Insight account too for screening payments
          if lease_resident.present?
            if [Lease::STATUS_LEAD, Lease::STATUS_APPLICANT].include?(lease_resident.lease.status)
              api = RenterInsightZegoApi.new(nil) # Renter Insight Main Account
              api.create_or_update_account(@object, :alternate_external_id, request)
              @object.alternate_external_id = api.read_gateway_payer_id
              @object.save
            end

            # Did the user want this to be their auto-pay payment method?
            if params[:resident_payment_method][:switch_recurring_payment_method]
              lease_resident.recurring_payment_method_id = @object.id
              lease_resident.save
            end
          end
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

  def destroy
    load_object_for_update()

    @object.destroy

    render_successful_update()
  end

   def handle_after_update

     if !params[:lease_resident_id].blank?
       lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first

       # Did the user want this to be their auto-pay payment method?
       if lease_resident.present? && params[:resident_payment_method][:switch_recurring_payment_method]
         lease_resident.recurring_payment_method_id = @object.id
         lease_resident.save
       end
     end
  end

  protected

  def object_params
    pp = params.require(:resident_payment_method).permit(ResidentPaymentMethod.public_fields() + ResidentPaymentMethod.transient_fields()) || {}
    pp = handle_resident_payment_method(pp)

    return pp
  end

  def render_successful_create()
    if !params[:lease_resident_id].blank?
      lease_resident = LeaseResident.where(hash_id: params[:lease_resident_id]).first
      render_json({singular_object_key() => @object, :lease_resident => lease_resident, success: true})
    else
      super
    end
  end

  def handle_resident_payment_method(permitted_params)

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