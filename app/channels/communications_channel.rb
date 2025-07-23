class CommunicationsChannel < ApplicationCable::Channel

  def self.channel_for_user(user)
    if user
      if user.is_resident?
        channel_for_resident_id(user.resident.id)
      else
        channel_for_company_id(user.company_id)
      end
    else
      nil
    end
  end

  def self.channel_for_resident_id(resident_id)
    "resident_communications_#{resident_id}"
  end

  def self.channel_for_company_id(company_id)
    "company_communications_#{company_id}"
  end

  def subscribed
    stream_from(CommunicationsChannel.channel_for_user(current_user))

    # No need to broadcast anything yet ActionCable.server.broadcast('communications', { communications: "are fun" })
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
