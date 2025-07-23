class Api::ZohoSignController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:success]

  def integration_details
    zoho_api = RenterInsightZohoApi::new
    token = zoho_api.get_access_token
    org_id = zoho_api.get_zsoid
    external_document = ExternalDocument.for_user(current_user).where(id: params[:id]).first

    if external_document.present?
      result = zoho_api.create_document_embed_url(external_document: external_document)
      if result[:status] == "success"
        render_json(
          {
            send_url: "#{result[:send_url]}&frameorigin=https://#{Rails.application.routes.default_url_options[:host]}&redirect_url=https://#{Rails.application.routes.default_url_options[:host]}/external_document/#{external_document.id}/sent_for_signature"
          }, true
        )
      else
        render_json(
          {
            error: true,
            message: "document not found"
          },true
        )
      end
    else
      render_json(
        {
          error: true,
          message: "document not found"
        },
        true
      )
    end
  end
end