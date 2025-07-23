class SystemMailer < ApplicationMailer
  include ApplicationHelper

  default from: "Renter Insight <#{Rails.application.credentials.dig(:imap, :email)}>"
  default reply_to: Rails.application.credentials.dig(:imap, :email)
  default bcc: Rails.application.credentials.dig(:smtp, :bcc)

  def application_error(message)
    @message = message
    mail(subject: 'Renter Insight Error', to: "sysadmin@eastfacesoftware.com") do |format|
      format.text
    end
  end

  def send_taxpayer_info_to_zego(company_id)
    @company = Company.find(company_id)
    @company_taxpayer_info = @company.company_taxpayer_info

    w9_pdf = PaymentService.generate_w9(@company)
    attachments["renter-insight-#{company_id}-w9.pdf"] = w9_pdf.to_pdf

    zego_pdf = WickedPdf.new.pdf_from_string(
      render_to_string(template: 'print/zego_agreement.html.erb', layout: 'print.html.erb', pdf: 'filename', locals: {company: @company})
    )
    attachments["renter-insight-#{company_id}-zego-agreement.pdf"] = zego_pdf

    @company.payments_activation_documents.each do | payments_activation_document |
      attachments["renter-insight-#{payments_activation_document.filename}"] = payments_activation_document.download
    end

    mail(subject: 'Renter Insight: New Company', to: "support@renterinsight.com") do |format|
      format.html
    end
  end

  def credit_builder_enrollment(filename)
    attachments[filename] = File.read("export/#{filename}")
    mail(subject: 'Renter Insight: TU Credit Builder - New Properties', to: Rails.env.development? ? "sysadmin@eastfacesoftware.com" : "support@renterinsight.com") do |format|
      format.html
    end
  end
end