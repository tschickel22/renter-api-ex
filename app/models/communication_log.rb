class CommunicationLog < LogsRecord
  include ActionView::Helpers::TextHelper
  belongs_to :communication

  serialize :data, JSON

  def self.read_to_address(message)
    target_domain = Rails.application.credentials.dig(:imap, :email).split('@').last

    #fetch to and from email address.. you can fetch other mail headers too in same manner.
    to_email = message.to.find{|e| e.include?(target_domain)}

    # The email could have been sent to this box via CC
    to_email = message.cc.find{|e| e.include?(target_domain)} if to_email.nil?

    return to_email
  end

  def self.store_inbound_email(message)

    to_email = CommunicationLog.read_to_address(message)

    # Figure out which organization this is for
    to_email_parts = to_email.split('@').first.split('+') if to_email.present?

    if to_email.present? && to_email_parts.count == 2
      body = get_message_body(message)
      communication = build_communication_object(message, body, to_email_parts[1])

      if communication.present?

        data = {}
        data[:to] = message.to
        data[:from] = message.from.first if message.from.present?
        data[:cc] = message.cc
        data[:subject] = message.subject
        data[:body] = body

        communication.communication_logs.build(data: data)

        if communication.save

          communication.deliver_to_all_mediums()

          return communication
        else
          puts("ProcessInboundEmail: could not save communication")
        end

      else
        puts("ProcessInboundEmail: no communication constructed")
      end

    else
      puts("ProcessInboundEmail: email address too generic #{to_email}")
    end

    return nil
  end

  def self.build_communication_object(message, body, email_hash_id)
    # The hash part of the email will contain the hash_id
    # EX: notifications+mri-ef66ceac2ad5e101, charge_hash_id: ef66ceac2ad5e101, object_type: mri
    object_type = email_hash_id.split('-').first
    object_hash_id = email_hash_id.split('-').last
    from_email_address = message.from.first

    puts("ProcessInboundEmail: processing #{object_type} #{object_hash_id} from #{from_email_address}")

    if ["rlre", "clre"].include?(object_type)
      lease_resident = LeaseResident.where(hash_id: object_hash_id).first
      lease = lease_resident.lease
      communication = CommunicationEmail.new(sub_type: "inbound_email", company_id: lease.company_id, property_id: lease.property_id, resident_id: lease_resident.resident_id)
      communication.to = lease.property

      if object_type.slice(0) == "r"
        communication.from = lease_resident.resident&.user
      elsif object_type.slice(0) == "c"
        communication.from = find_company_user(lease.company_id, from_email_address)
      end

    elsif ["rmrc", "cmrc", "cmri"].include?(object_type)
      maintenance_request = MaintenanceRequest.where(hash_id: object_hash_id).first

      if object_type == "cmri"
        communication = CommunicationNotePrivate.new(sub_type: "internal_notes", company_id: maintenance_request.company_id, property_id: maintenance_request.property_id)
      else
        communication = CommunicationNotePublic.new(sub_type: "conversation_with_resident", company_id: maintenance_request.company_id, property_id: maintenance_request.property_id, resident_id: maintenance_request.resident_id)
      end

      communication.related_object = maintenance_request
      communication.to = maintenance_request.property

      if object_type.slice(0) == "r"
        communication.from = maintenance_request.resident&.user
      elsif object_type.slice(0) == "c"
        communication.from = find_company_user(maintenance_request.company_id, from_email_address)
      end

      process_attachments(message, maintenance_request)

    elsif ["rccc", "cccc"].include?(object_type)
        source_communication = Communication.unscoped.where(hash_id: object_hash_id).first
        communication = CommunicationNotePublic.new(sub_type: Communication::SUB_TYPE_COMMUNICATIONS_CENTER, company_id: source_communication.company_id, property_id: source_communication.property_id, resident_id: source_communication.resident_id)
        communication.related_object = source_communication.related_object

        if object_type.slice(0) == "r"
          communication.from = communication.related_object.resident&.user
          communication.to = source_communication.property
        elsif object_type.slice(0) == "c"
          communication.from = find_company_user(source_communication.company_id, from_email_address)
          communication.to = communication.related_object&.resident || source_communication.property
        end

    end

    communication.body = CommunicationLog.new.read_reply(body) if communication.present?

    return communication
  end

  def self.find_company_user(company_id, email)
    user = User.where(company_id: company_id, email: email).where.not(user_type: [User::TYPE_RESIDENT]).first

    # Maybe they're using the + trick?
    if user.nil?
      plus_email_trick = email.gsub('@', '+%@')
      user = User.where(company_id: company_id).where("email like :email", {email: "%#{plus_email_trick}%"}).where.not(user_type: [User::TYPE_RESIDENT]).first
    end

    return user
  end

  def self.get_message_body(message, prefer_text_part = false)
    plain_part = message.text_part ? message.text_part.body.decoded : nil
    html_part = message.html_part ? message.html_part.body.decoded : nil

    if prefer_text_part
      body = plain_part || message.body.decoded || html_part
    else
      body = html_part || plain_part || message.body.decoded
    end

    return body.to_s.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
  end

  def self.process_attachments(message, related_object)
    if !message.attachments.blank? && related_object.present?
      message.attachments.each do |attachment|

        attachment_path = "/from_email/#{message.message_id}/#{attachment.filename}"
        full_attachment_filename = "public/uploads"+attachment_path
        puts "CommunicationLog Trying to save "+full_attachment_filename
        attachment.body.decoded

        if related_object.is_a?(MaintenanceRequest)

          # Fake the file
          data = StringIO.new(attachment.body.decoded)
          data.class_eval do
            attr_accessor :content_type, :original_filename
          end

          data.content_type = attachment.content_type
          data.original_filename = File.basename(attachment.filename)

          related_object.photos.attach(
            io: data,
            filename: data.original_filename,
            content_type: data.content_type
          )
        end

      end
    end
  end

  def read_reply(message_body)

    # Let's try to do this intelligently so that the resulting text looks close to how it would appear in a browser... just without any formatting
    newline_tags = ['</tr>', '<br>', '<br class="">', '<hr>', '</p>']

    modified_body = message_body || ''

    modified_body = modified_body.gsub('<p class="MsoNormal"><o:p>&nbsp;</o:p></p>', '~~RI BREAK~~&nbsp;') # Outlook

    newline_tags.each do | newline_tag |
      modified_body = modified_body.gsub(newline_tag, "~~RI BREAK~~#{newline_tag}")
      modified_body = modified_body.gsub(newline_tag.upcase, "~~RI BREAK~~#{newline_tag.upcase}")
    end

    # Mark the break in messages
    modified_body = modified_body.gsub("<blockquote", "~~RI LAST MESSAGE<blockquote")
    modified_body = modified_body.gsub('<p class="MsoNormal"><b>From', "~~RI LAST MESSAGE<p>") # Outlook

    stripped_body_parts = strip_tags(modified_body).split("~~RI BREAK~~").select{|b| !b.blank? }.collect{|b| b.strip}

    # Remove everything after ~~RI LAST MESSAGE
    found_last_message = false

    stripped_body_parts = stripped_body_parts.select do |part|
      found_last_message ||= part.include?('~~RI LAST MESSAGE')

      !found_last_message
    end

    # Do we need to look for salutations?
    return stripped_body_parts.join("\n")

  end
end
