class Communication < ParanoidRecord
  include ActionView::Helpers::TextHelper
  include ApplicationHelper

  before_create :generate_long_hash
  attr_accessor :email_result
  has_many :communication_logs
  belongs_to :company
  belongs_to :property
  belongs_to :resident
  belongs_to :from, polymorphic: true
  belongs_to :to, polymorphic: true
  belongs_to :related_object, polymorphic: true

  SUB_TYPE_COMMUNICATIONS_CENTER = "communications_center"
  SUB_TYPE_ANNOUNCEMENT = 'announcement'
  serialize :mediums, Array

  MEDIUM_EMAIL = 'email'
  MEDIUM_CHAT = 'chat'
  MEDIUM_TEXT = 'text'

  def deliver_to_all_mediums()
    return if self.is_a?(CommunicationNotePrivate)

    if self.related_object.is_a?(Announcement)
      #
      # Send Email
      #
      if self.is_from_a_resident?
        CompanyMailer.send_to_appropriate_users(:communication_center_comment_added, self.property || self.company, self.id)
      else

        if self.mediums.include?(Communication::MEDIUM_EMAIL) && !self.resident&.email.blank?
          ResidentMailer.announcement(self.id).deliver
        end
        
        #
        # Send Text
        #
        if self.mediums.include?(Communication::MEDIUM_TEXT)
          begin
            RenterInsightTwilioApi.new.send_message(self)
          rescue
            # Do nothing...
          end
        end
      end
    elsif self.related_object.is_a?(MaintenanceRequest) && self.type == CommunicationNotePublic.to_s

      #
      # Send Email
      #
      if self.is_from_a_resident?
        CompanyMailer.send_to_appropriate_users(:maintenance_request_comment_added, self.property || self.company, self.related_object.id, self.id)
      elsif self.resident.present?
        ResidentMailer.maintenance_request_comment_added(self.related_object.id, self.id).deliver
      end

    elsif self.related_object.is_a?(LeaseResident) && self.sub_type == Communication::SUB_TYPE_COMMUNICATIONS_CENTER

      #
      # Send Email
      #
      if self.is_from_a_resident?
        CompanyMailer.send_to_appropriate_users(:communication_center_comment_added, self.property || self.company, self.id)
      elsif self.resident.present?
        ResidentMailer.communication_center_comment_added(self.id).deliver

        #
        # Should we send a text too? Yes, if the last message from the resident was a text
        #
        most_recent_communication = Communication.where(related_object_type: LeaseResident, sub_type: Communication::SUB_TYPE_COMMUNICATIONS_CENTER, resident: self.resident, from_type: User, from_id: self.resident.user_id).order(:id).last

        if most_recent_communication.present? && most_recent_communication.mediums.include?(Communication::MEDIUM_TEXT) && !self.mediums.include?(Communication::MEDIUM_TEXT)
          #
          # Send Text
          #
          begin
            RenterInsightTwilioApi.new.send_message(self)
            self.mediums << Communication::MEDIUM_TEXT
            self.save
          rescue
            # Do nothing...
          end
        end
      end
    end

    if self.mediums.include?(Communication::MEDIUM_CHAT)
      broadcast()
    end
  end

  def is_from_a_resident?
    return true if from_type.present? && from_type == Resident.to_s

    if from_type.present? && from_type == User.to_s
      return from.is_resident?
    end

    return false
  end

  def self.for_user(current_user)
    if current_user
      if current_user.is_resident?
        Communication.where(company_id: current_user.resident.leases.collect{|l| l.company_id}).where(resident_id: current_user.resident.id)
      else
        Communication.where(company_id: current_user.company_id)
      end
    else
      Communication.where("1=0")
    end
  end

  def log_raw_email
    if email_result.present? && email_result.body.present?
      self.body = parse_email_body(email_result.body.raw_source) if self.body.blank?

      communication_log = self.communication_logs.build

      communication_log.data = {medium: Communication::MEDIUM_EMAIL}
      communication_log.data[:to] = email_result.to
      communication_log.data[:from] = email_result.from.first if email_result.from.present?
      communication_log.data[:subject] = email_result.subject
      communication_log.data[:body] = email_result.body.to_s

    end
  end

  def save_raw_text(result)
    if result.present?

      communication_log = self.communication_logs.build

      communication_log.data = {medium: Communication::MEDIUM_TEXT}

      if result.is_a?(Hash)
        communication_log.data[:to] = result[:To]
        communication_log.data[:from] = result[:From]
        communication_log.data[:status] = result[:SmsStatus]
        communication_log.data[:sid] = result[:MessageSid]
        communication_log.data[:body] = result[:Body]
      else
        communication_log.data[:to] = result.to
        communication_log.data[:from] = result.from
        communication_log.data[:status] = result.status
        communication_log.data[:error_message] = result.error_message
        communication_log.data[:sid] = result.sid
        communication_log.data[:body] = result.body.to_s
      end

      communication_log.save

    end
  end

  def body_without_html
    message_body = self.body.clone

    # Let's try to do this intelligently so that the resulting text looks close to how it would appear in a browser... just without any formatting
    newline_tags = ['</tr>', '<br>', '<br class="">', '<hr>', '</p>']

    modified_body = message_body || ''

    modified_body = modified_body.gsub('<p class="MsoNormal"><o:p>&nbsp;</o:p></p>', '~~RI BREAK~~&nbsp;') # Outlook

    newline_tags.each do | newline_tag |
      modified_body = modified_body.gsub(newline_tag, "~~RI BREAK~~#{newline_tag}")
      modified_body = modified_body.gsub(newline_tag.upcase, "~~RI BREAK~~#{newline_tag.upcase}")
    end

    # Mark the break in messages
    stripped_body_parts = strip_tags(modified_body).split("~~RI BREAK~~").select{|b| !b.blank? }.collect{|b| b.strip}

    # Do we need to look for salutations?
    return stripped_body_parts.join("\n")
  end

  def find_lease_resident
    if related_object_type == LeaseResident.to_s
      return related_object
    elsif related_object_type == Announcement.to_s
      return LeaseResident.joins(:lease).where(leases: {property_id: self.property_id}, resident_id: self.resident_id).last
    end
  end

  def self.public_fields
    [:subject, :body, :type, :sub_type, :related_object_id, :related_object_type, :resident_id, :mediums]
  end

  def self.private_fields
    [:id, :hash_id, :company_id, :property_id, :from_type, :from_id, :to_type, :to_id, :read_at, :created_at, :updated_at, :trashed_at]
  end

  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.body body_without_html
      json.from from.to_builder("partial").attributes! if from.present?

      if level == "full" || level == "limited"
        recipients = communication_logs.collect do |cl|
          if cl.data.present? && cl.data["to"].present?
            if cl.data["medium"] == "text"
              [cl.data["to"]].flatten.collect{|p| ResidentService.format_phone_number(p)}
            else
              cl.data["to"]
            end
          else
            []
          end
        end

        json.recipients recipients.uniq.flatten
      end

      if level == "full"
        json.related_object related_object.to_builder("partial").attributes! if related_object.present?
      end
    end
  end

  protected

  def parse_email_body(str)
    start_key = '<!-- CONTENT START -->'
    end_key = '<!-- CONTENT END -->'

    start_pos = str.index(start_key)

    if start_pos && start_pos > 0
      end_pos = str.index(end_key, start_pos)

      return str.slice((start_pos + start_key.length)..(end_pos - 1)).strip
    else
      return str
    end
  end

  def broadcast
    if self.to.is_a?(Resident)
      ActionCable.server.broadcast(CommunicationsChannel.channel_for_resident_id(self.to_id), { communications: "reload" })
    elsif self.to.is_a?(Property)
      ActionCable.server.broadcast(CommunicationsChannel.channel_for_company_id(self.to.company_id), { communications: "reload" })
    end
  end
end
