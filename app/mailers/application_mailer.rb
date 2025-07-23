include ApplicationHelper

class ApplicationMailer < ActionMailer::Base
  include Resque::Mailer

  layout 'mailer'

  def self.base_url
    return ( 'https' == ActionMailer::Base.default_url_options[:protocol] ? 'https' : 'http') + "://#{ActionMailer::Base.default_url_options[:host]}#{ActionMailer::Base.default_url_options[:port].nil? || [80,443].include?(ActionMailer::Base.default_url_options[:port]) ? '' : ':' + ActionMailer::Base.default_url_options[:port].to_s}"
  end

  def build_reply_to_address(email_config)
    from = Rails.application.credentials.dig(:imap, :email)
    from_parts = from.split('@')
    extension = ""
    reply_to = email_config[action_name.to_sym][:reply_to]

    if reply_to == "lease_resident"
      extension = "lre-#{@lease_resident.hash_id}" if @lease_resident.present?
    elsif reply_to == "maintenance_request:comments"
      extension = "mrc-#{@maintenance_request.hash_id}" if @maintenance_request.present?
    elsif reply_to == "maintenance_request:internal_notes"
      extension = "mri-#{@maintenance_request.hash_id}" if @maintenance_request.present?
    elsif reply_to == "communication_center:comments"
      extension = "ccc-#{@communication.hash_id}" if @communication.present?
    end

    if !extension.blank?
      extension = self.class.to_s.slice(0).downcase + extension
      return "#{from_parts.first}+#{extension}@#{from_parts.last}"
    else
      return from
    end
  end

  def self.deliver_mail(mail)
    if UnsubscribedEmail.where(email: mail.to).exists?
      Rails.logger.error("#{mail.to} is UNSUBSCRIBED")
    else
      super
    end
  end
end
