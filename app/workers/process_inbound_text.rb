include WorkerHelper

class ProcessInboundText
  def self.enqueue(data)
    Resque.enqueue_to("process_inbound_text", self, data)
  end

  def self.perform(data)
    log("*** START ProcessInboundText")
    params = JSON.parse(data).deep_symbolize_keys
    log("ProcessInboundText #{params.to_json}")

    residents = ProcessInboundText.find_residents(params[:From])

    if !residents.empty?
      # Figure out the most recent Communication
      most_recent_communication = CommunicationNotePublic.where(resident_id: residents.collect{|r| r.id}).order(:created_at).last

      # Did we not find a text that preceded this one? If not, create one
      communication = CommunicationNotePublic.new(body: params[:Body])
      communication.mediums = [Communication::MEDIUM_TEXT, Communication::MEDIUM_CHAT]

      if most_recent_communication.present?
        communication.company_id = most_recent_communication.company_id
        communication.property_id = most_recent_communication.property_id
        communication.resident_id = most_recent_communication.resident_id
        communication.related_object_id = most_recent_communication.related_object_id
        communication.related_object_type = most_recent_communication.related_object_type
        communication.from = (most_recent_communication.resident.user || most_recent_communication.resident)
        communication.to = most_recent_communication.property
        communication.sub_type = most_recent_communication.sub_type
      else
        resident = residents.last
        lease = resident.current_or_future_lease
        communication.company_id = lease.company_id
        communication.property_id = lease.property_id
        communication.resident_id = resident.id
        communication.related_object_id = LeaseResident.where(lease_id: lease.id, resident_id: resident.id).first.id
        communication.related_object_type = LeaseResident.to_s
        communication.from = resident.user
        communication.to = lease.property
        communication.sub_type = Communication::SUB_TYPE_COMMUNICATIONS_CENTER
      end

      communication.save
      communication.save_raw_text(params)

      communication.deliver_to_all_mediums()

    else
      log("ProcessInboundText resident not found #{params[:From]}")
    end

    log("*** END ProcessInboundText")
  end

  def self.find_residents(phone)
    phone = phone.gsub(/^\+\d/, '').gsub(/[^0-9]/, '')
    phone = "#{phone[0..2]}-#{phone[3..5]}-#{phone[6..9]}"
    return Resident.where(phone_number: phone)
  end

  def self.get_most_recent_resident(params)
    # Find all the text messages sent to this phone number, pick off the last one.  That's the resident in question (or, at least, we have to assume so)
    most_recent_text_message = nil
    most_recent_resident = nil
    residents = Resident.where(phone_number: params[:From].gsub(/^\+\d/, '').gsub(/[^0-9]/, ''))

    residents.each do | resident |

      last_text_message = Communication.where(to_id: resident.id, to_type: Resident.to_s).where("mediums like '%text%'").order(:created_at).last

      if last_text_message.present? && (most_recent_text_message.nil? || last_text_message.created_at > most_recent_text_message.created_at)
        most_recent_text_message = last_text_message
        most_recent_resident = resident
      end

    end

    return most_recent_resident || residents.where(text_opted_out_at: nil).first
  end
end