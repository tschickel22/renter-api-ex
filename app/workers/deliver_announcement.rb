class DeliverAnnouncement

  def self.enqueue(object)
    Resque.enqueue_to(object.is_a?(Announcement) ? 'announcements_populate' : 'announcements_deliver', DeliverAnnouncement, object.class.to_s, object.id)
  end

  def self.perform(object_type = nil, object_id = nil)
    if object_type.nil?
      find_scheduled_announcements()
    elsif object_type == Announcement.to_s
      generate_communications(object_id)
    elsif object_type == Communication.to_s
      deliver_communication(object_id)
    end
  end

  def self.find_scheduled_announcements
    Announcement.where(status: Announcement::STATUS_QUEUED).each do | announcement |
      if announcement.time_to_deliver?
        Rails.logger.error("Enqueue Announcement ##{announcement.id}")
        DeliverAnnouncement.enqueue(announcement)
      else
        Rails.logger.error("NOT TIME TO DELIVER Announcement ##{announcement.id}")
      end
    end
  end

  def self.generate_communications(announcement_id)
    announcement = Announcement.find(announcement_id)

    if announcement.present? && announcement.status == Announcement::STATUS_QUEUED

      announcement.status = Announcement::STATUS_SENDING
      announcement.save(validate: false)

      lease_residents = announcement.determine_recipient_lease_residents()
      lease_residents.each do | recipient |

        communication = Communication.new(company_id: announcement.company_id)
        communication.type = CommunicationNotePublic
        communication.sub_type = Communication::SUB_TYPE_ANNOUNCEMENT
        communication.related_object = announcement
        communication.company_id = recipient.lease&.company_id
        communication.property_id = recipient.lease&.property_id
        communication.resident_id = recipient.resident_id
        communication.from = announcement.sent_by_user
        communication.to_type = Resident.to_s
        communication.to_id = recipient.resident_id
        communication.body = announcement.prepare_body(recipient)
        communication.mediums = announcement.mediums

        # Resident is not opted into text messages
        if recipient.resident.present? && recipient.resident.text_opted_out_at.present?
          communication.mediums.delete(Communication::MEDIUM_TEXT)
        end

        communication.save

        DeliverAnnouncement.enqueue(communication)
      end

      announcement.status = Announcement::STATUS_SENT
      announcement.sent_at = Time.now
      announcement.save(validate: false)

    end
  end

  def self.deliver_communication(communication_id)
    communication = Communication.find(communication_id)
    communication.deliver_to_all_mediums()
  end
end