class AddMediumsToCommunications < ActiveRecord::Migration[6.1]
  def change
    #add_column :communications, :mediums, :string, after: :resident_id

    Communication.unscoped.each do | communication |
      mediums = communication.mediums
      mediums = [Communication::MEDIUM_EMAIL] if communication.type == "CommunicationEmail"
      mediums = [Communication::MEDIUM_TEXT] if communication.type == "CommunicationText"
      mediums = [Communication::MEDIUM_CHAT] if communication.type == "CommunicationChat"
      mediums = [Communication::MEDIUM_CHAT] if mediums.blank?

      communication.type = "CommunicationNotePublic" if  ![CommunicationNotePublic.to_s, CommunicationNotePrivate.to_s].include?(communication.type) && communication.sub_type == Communication::SUB_TYPE_COMMUNICATIONS_CENTER
      communication.mediums = mediums
      communication.save(validate: false)
    end
  end
end
