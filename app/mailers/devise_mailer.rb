class DeviseMailer < Devise::Mailer
  include ApplicationHelper
  layout 'mailer'

  default from: "Renter Insight <#{Rails.application.credentials.dig(:imap, :email)}>"
  default reply_to: Rails.application.credentials.dig(:imap, :email)
  default bcc: Rails.application.credentials.dig(:smtp, :bcc)
end