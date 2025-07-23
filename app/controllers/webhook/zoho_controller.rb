class Webhook::ZohoController < ApplicationController

  skip_before_action :verify_authenticity_token

  def subscriptions
    Rails.logger.error("Zoho Subscriptions: ")
    Rails.logger.error(request.raw_post)

    # Try to handle this request right away. If it doesn't work, toss it into Resque
    begin
      HandleSubscriptionUpdate.perform(request.raw_post)
    rescue
      HandleSubscriptionUpdate.enqueue_exception(request.raw_post, $!)
    end

    render plain: "Ok"
  end

  # http://local.renterinsight.com:3000/subscriptions/complete?hostedpage_id=2-3a224e86f7fd45c7e404e6f6919bb2e447bb9d90424fe49d1ad4045cbc1e01f4140ed0ae9acffa71c06d04c531805695
  def subscriptions_complete
    # We hit this page after a user has signed up with Zoho.
    # Call Zoho for the details, update the record and send the user on to a thank you page
    # We can't test this outside of production... so fake it
    if Rails.env.production?
      subscription_details = RenterInsightZohoApi.new.get_hosted_page_session(params[:hostedpage_id])
    else
      subscription_details = {data: {subscription: {subscription_id: "fake-#{Time.now.to_i}", status: "live"}}}
    end

    if current_user.present? && subscription_details && subscription_details[:data] && subscription_details[:data][:subscription]
      # Update the current user's company record accordingly
      begin
        if current_user.is_resident?
          HandleSubscriptionUpdate.update_resident_subscription_data(current_user.resident, subscription_details[:data][:subscription], subscription_details[:data][:invoice])
        else
          HandleSubscriptionUpdate.update_company_subscription_data(current_user.company, subscription_details[:data][:subscription])
        end

      rescue
        HandleSubscriptionUpdate.enqueue_exception("occurred in subscriptions_complete", $!)
      end
    end

    if current_user.is_resident?
      redirect_to "/portal/credit_reporting/thank_you"
    else
      redirect_to "/subscriptions/thank_you"
    end
  end

  def document_status
    external_document_id = params[:requests][:request_id]
    status = "#{params[:notifications][:operation_type]}"
    action_id = "#{params[:notifications][:action_id]}"

    external_document = ExternalDocument.find_by(external_id: external_document_id)

    if external_document.present? && action_id.present? && external_document.status != "executed"
      actions = JSON.parse(external_document.actions)
      all_signed = true

      actions.each do |action|
        if action["action_id"] == action_id
          action["status"] = status
          action["ip_address"] = params[:notifications][:ip_address]
          action["action_performed_at"] = params[:notifications][:performed_at]
        end

        if action["status"] != 'RequestSigningSuccess'
          all_signed = false
        end

      end

      file = nil

      begin
        zoho_api = RenterInsightZohoApi::new
        result = zoho_api.get_external_document_pdf(external_document: external_document)
        if result
          file = StringIO.new(result)
          file.class.class_eval { attr_accessor :original_filename, :content_type }
          file.original_filename = "#{external_document.document_name}.signed.pdf"
          file.content_type = "application/pdf"
          external_document.attachment.attach(io: file, filename: file.original_filename, content_type: file.content_type)
        end
      rescue
        puts "document could not be downloaded"
      ensure
        file = nil
      end

      external_document.reload
      external_document.actions = actions.to_json
      if external_document.status != "executed"
        external_document.status = all_signed ? 'executed' : 'in_progress'
      end
    end

    render plain: "Ok"
  end

  def zoho_document_thank_you
    if current_user.present?
      if current_user.is_resident?
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/portal"
      else
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/onboarding/lease_docs/pending-signature"
      end
    else
      @redirect_url = "#"
    end
  end

  def zoho_document_complete
    if current_user.present?
      if current_user.is_resident?
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/portal"
      else
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/onboarding/lease_docs/executed"
      end
    else
      @redirect_url = "#"
    end

    external_document = ExternalDocument.find params[:id]
    external_document.status = 'executed'
    external_document.should_be_billed = true
    external_document.save!

    file = nil
    begin
      zoho_api = RenterInsightZohoApi::new
      result, content_type = zoho_api.get_external_document_pdf(external_document: external_document)
      if result
        extension = content_type == "application/pdf;charset=UTF-8" ? "pdf" : "zip"
        file = StringIO.new(result)
        file.class.class_eval { attr_accessor :original_filename, :content_type }
        file.original_filename = "#{external_document.document_name}.executed.#{extension}"
        file.content_type = content_type
        external_document.attachment.attach(io: file, filename: file.original_filename, content_type: file.content_type)
      end
    rescue
     puts "document could not be downloaded"
    ensure
      file = nil
    end

    external_document.save!
  end

  def zoho_document_signed
    if current_user.present?
      if current_user.is_resident?
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/portal"
      else
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/onboarding/lease_docs/pending-signature"
      end
    else
      @redirect_url = "#"
    end

    external_document = ExternalDocument.find params[:id]
    if external_document.present? && external_document.status != "executed"
      external_document.status = "in_progress"

      file = nil
      begin
        zoho_api = RenterInsightZohoApi::new
        result, content_type = zoho_api.get_external_document_pdf(external_document: external_document)
        if result
          extension = content_type == "application/pdf;charset=UTF-8" ? "pdf" : "zip"
          file = StringIO.new(result)
          file.class.class_eval { attr_accessor :original_filename, :content_type }
          file.original_filename = "#{external_document.document_name}.executed.#{extension}"
          file.content_type = content_type
          external_document.attachment.attach(io: file, filename: file.original_filename, content_type: file.content_type)
        end
      rescue
        puts "document could not be downloaded"
      ensure
        file = nil
      end

      external_document.save!
    end
  end

  def zoho_document_sent_for_signature
    if current_user.present?
      if current_user.is_resident?
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/portal"
      else
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/onboarding/lease_docs/pending-signature"
      end
    else
      @redirect_url = "#"
    end

    external_document = ExternalDocument.find(params[:id])
    external_document.status = "sent_for_signature"
    external_document.save!
  end

  def zoho_document_template_updated
    if current_user.present?
      if current_user.is_resident?
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/portal"
      else
        @redirect_url = "https://#{Rails.application.routes.default_url_options[:host]}/onboarding/lease_docs/templates"
      end
    else
      @redirect_url = "#"
    end

    external_document = ExternalDocument.find_by(external_id: params[:id])

    zoho_api = RenterInsightZohoApi::new
    result = zoho_api.get_template(template_id: params[:id])
    if result[:status] === "success"
      external_document.actions = result[:templates][:actions].to_json
      external_document.save!
    end
  end
end