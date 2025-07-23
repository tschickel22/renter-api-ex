class Api::EmailTemplatesController < Api::ApiController

  def index

    company_emails = CompanyMailer.email_config
    resident_emails = ResidentMailer.email_config

    render_json({company_emails: company_emails.keys.collect{|k| company_emails[k].merge({id: k})}, resident_emails: resident_emails.keys.collect{|k| resident_emails[k].merge({id: k})}})
  end

  def show
    parts = params[:id].split(":")

    if parts.first == "company"
      config = CompanyMailer.email_config
      path = "app/views/company_mailer"
    elsif parts.first == "resident"
      config = ResidentMailer.email_config
      path = "app/views/resident_mailer"
    end

    if config[parts.last.to_sym]
      # Bring in some, but not all of the email style
      css_text = "<style>h1, h2 { text-align: center; }</style>"
      file_content = File.read("#{path}/#{parts.last}.html.erb")

      render_json({body: css_text + file_content})
    else
      render_json({errors: "Template not found"}, false)
    end
  end

end