class Api::CommunicationsController < Api::ApiController

  def model_class
    Communication
  end

  def primary_key_field
    :hash_id
  end

  def setup_new_object()
    if !params[:communication].blank? && object_params[:sub_type] == Communication::SUB_TYPE_COMMUNICATIONS_CENTER
      CommunicationNotePublic.new()
    elsif !params[:communication].blank? && !object_params[:type].blank? && object_params[:type].include?("Communication")
      Object::const_get(object_params[:type]).new()
    else
      model_class().new()
    end
  end

  def show
    if ["new_email", "new_text", "new_chat"].include?(params[:id])

      @object = setup_new_object
      @object.related_object_id = ""
      @object.type = CommunicationNotePublic

      if params[:id] == "new_text"
        @object.mediums = ["text"]
      elsif params[:id] == "new_chat"
        @object.mediums = ["chat", "email", "text"]
      else
        @object.mediums = ["chat", "email", "text"]
      end

      render_successful_update
    else
      super
    end
  end

  def handle_before_create_save
    load_related_object()

    @object.related_object = @related_object

    if @related_object.is_a?(MaintenanceRequest)
      @object.company_id = @related_object.company_id
      @object.property_id = @related_object.property_id
      @object.resident_id = @related_object.resident_id
      @object.mediums = [Communication::MEDIUM_EMAIL]

      if current_user.present?
        @object.from = current_user

        if current_user.is_resident?
          @object.to_type = Property.to_s
          @object.to_id = @object.property_id
        else
          @object.to_type = "Resident"
          @object.to_id = @related_object.resident_id
        end
      else
        # Assume this is a vendor
        if @related_object.assigned_to.is_a?(Vendor)
          @object.from = @related_object.assigned_to
        end

        @object.to_type = Property.to_s
        @object.to_id = @related_object.property_id
      end

    elsif @object.sub_type == Communication::SUB_TYPE_COMMUNICATIONS_CENTER && @related_object.is_a?(LeaseResident)
      @object.type = CommunicationNotePublic
      @object.company_id = @related_object.lease&.company_id
      @object.property_id = @related_object.lease&.property_id
      @object.resident_id = @related_object.resident_id
      @object.mediums = [Communication::MEDIUM_CHAT] if @object.mediums.blank?

      if !current_user.is_resident? && @object.mediums.include?(Communication::MEDIUM_TEXT) && (@related_object.resident.nil? || @related_object.resident.text_opted_out_at.present? || @related_object.resident.phone_number.blank?)
        # Resident is not opted into text messages
        @object.mediums.delete(Communication::MEDIUM_TEXT)
      end

      if current_user.present?
        @object.from = current_user

        if current_user.is_resident?
          @object.to_type = Property.to_s
          @object.to_id = @object.property_id
        else
          @object.to_type = "Resident"
          @object.to_id = @related_object.resident_id
        end

      end
    else
      @object.company_id = @related_object.company_id
      @object.from = current_user
    end
  end

  def handle_after_create
    if @related_object.is_a?(LeaseResident) && @object.sub_type == Communication::SUB_TYPE_COMMUNICATIONS_CENTER && @object.mediums.include?(Communication::MEDIUM_TEXT)

      #
      # Send Text
      #
      begin
        RenterInsightTwilioApi.new.send_message(@object) if current_user.present? && !current_user.is_resident?
      rescue
        # If we had a failure, don't persist @object
        @object.destroy
        raise $!
      end
    end

    @object.deliver_to_all_mediums()

  end

  def trash
    load_object_for_update

    if @object.present? && @object.update({trashed_at: Time.now})
      render_successful_update()
    else
      render_failed_update
    end
  end

  def destroy
    load_object_for_update

    if @object.present? && @object.destroy
      render_successful_update()
    else
      render_failed_update
    end
  end

  def trash_conversation
    lease_resident = LeaseResident.where(hash_id: params[:id]).first
    communications = Communication.for_user(current_user).where(sub_type: Communication::SUB_TYPE_COMMUNICATIONS_CENTER, trashed_at: nil, related_object: lease_resident)

    success = communications.update({trashed_at: Time.now})

    render_json({communications: communications}, success)
  end

  def destroy_conversation
    lease_resident = LeaseResident.where(hash_id: params[:id]).first
    communications = Communication.for_user(current_user).where(sub_type: Communication::SUB_TYPE_COMMUNICATIONS_CENTER, related_object: lease_resident).where.not(trashed_at: nil)

    success = communications.destroy_all

    render_json({communications: communications}, success)
  end

  def search

    loading_system_email = params[:communication].present? && params[:communication][:type] == "system_email"

    # Searches come for various slices of the communications world...
    # 1) Comments for an object
    if !params[:related_object_type].blank?
      load_related_object()

      if params[:related_object_type] == MaintenanceRequest.to_s
        objects = Communication.where(company_id: @related_object.company_id).where(related_object_type: params[:related_object_type], related_object_id: @related_object&.id)
      elsif loading_system_email
        objects = Communication.for_user(current_user).where(type: CommunicationEmail.to_s, resident_id: params[:related_object_hash_id] || -1)
      elsif params[:related_object_type] == LeaseResident.to_s
        objects = Communication.for_user(current_user).where(related_object_type: [params[:related_object_type], Announcement.to_s], resident_id: @related_object&.resident_id)
      elsif params[:related_object_type] == Lease.to_s && params[:type] == CommunicationNotePrivate.to_s
        # Special case for lease activities... find all connected leases
        objects = Communication.for_user(current_user).where(related_object_type: params[:related_object_type], related_object_id: Lease.get_related_lease_ids(@related_object&.id))
      else
        objects = Communication.for_user(current_user).where(related_object_type: params[:related_object_type], related_object_id: @related_object&.id)
      end

    else
      objects = Communication.for_user(current_user)
    end

    objects = objects.includes({ related_object: :resident }, :from, :communication_logs)

    objects = apply_search_text(objects)

    objects = objects.where(type: params[:type]) if !params[:type].blank? && !["inbox", "sent", "trash", "system_email"].include?(params[:type])

    if !params[:sub_type].blank?
      if current_user.is_resident? && params[:sub_type] == Communication::SUB_TYPE_COMMUNICATIONS_CENTER
        objects = objects.where(sub_type: [Communication::SUB_TYPE_COMMUNICATIONS_CENTER, Communication::SUB_TYPE_ANNOUNCEMENT])
      else
        objects = objects.where(sub_type: params[:sub_type])
      end

    end
    objects = objects.where(property_id: params[:property_id]) if !params[:property_id].blank?

    objects, total = page(objects)

    if params[:format] == "csv"
      csv_data = generate_csv(objects)
      render_json({csv: csv_data})
    else
      render_json({ plural_object_key() => objects.collect{|o| o.to_builder(loading_system_email ? "limited" : "full").attributes! }, total: total  })
    end

  end

  def apply_search_text(objects)
    if !params[:search_text].blank?
      if current_user.is_resident?
        objects = objects.joins(:property).where(["communications.body like :search_text OR properties.name like :search_text", {search_text: "%#{params[:search_text]}%"}])
      else
        objects = objects.left_joins(:resident).where(["communications.subject like :search_text OR communications.body like :search_text OR residents.first_name like :search_text OR residents.last_name like :search_text OR CONCAT(residents.first_name, ' ', residents.last_name) like :search_text", {search_text: "%#{params[:search_text]}%"}])
      end
    end

    return objects
  end

  def conversations
    communications = Communication.for_user(current_user).where("related_object_type in ('MaintenanceRequest', 'LeaseResident', 'Announcement') #{current_user.is_resident? ? "" : "or (type = 'CommunicationEmail')"}")
    communications = communications.includes({ related_object: :resident }, :from, :resident)

    communications = apply_search_text(communications)

    communications = communications.where(property_id: params[:property_id]) if !params[:property_id].blank?

    #
    # Organize into Conversations
    #
    conversations = communications.inject({}) do | acc, communication |
      if communication.related_object.is_a?(MaintenanceRequest) && !communication.related_object.is_open?
        # DO NOTHING IF CLOSED
      elsif (communication.type != CommunicationEmail.to_s && communication.related_object.present?) || (communication.type == CommunicationEmail.to_s && communication.resident.present?)
        if current_user.is_resident?
          key = "#{communication.related_object_type}:#{communication.related_object_id}"
        elsif communication.type == CommunicationEmail.to_s
          key = "SystemEmail:#{communication.resident_id}"
        else
          key = "#{communication.related_object_type}:#{communication.related_object_id}#{communication.trashed_at.present? ? ":trashed" : ""}"
        end

        two_way = false
        unread = false

        if current_user.is_resident?
          conversation_id = communication.related_object.hash_id
          title = communication.property&.name
          if communication.to_type == "Resident"
            two_way = true
            unread = communication.read_at.nil?
          end

          # Special handling for Announcements
          if communication.related_object.is_a?(Announcement)
            lease_resident = communication.find_lease_resident
            conversation_id = lease_resident.hash_id
            key = "LeaseResident:#{lease_resident.id}"
          end
        elsif communication.type == CommunicationEmail.to_s
          conversation_id = communication.resident_id
          title = communication.resident.name
        elsif communication.related_object.is_a?(Announcement)
          lease_resident = communication.find_lease_resident
          conversation_id = lease_resident.hash_id
          key = "LeaseResident:#{lease_resident.id}"
          title = communication.resident.name

          if communication.to_type == "Property"
            two_way = true
            unread = communication.read_at.nil?
          end
        else
          conversation_id = communication.related_object.hash_id
          title = communication.related_object&.name
          if communication.to_type == "Property"
            two_way = true
            unread = communication.read_at.nil?
          end
        end

        if acc[key].nil?

          acc[key] = {
            id: conversation_id,
            property_id: communication.property_id,
            related_object_type: communication.related_object_type,
            created_at: communication.created_at,
            two_way: two_way,
            title: title,
            body: communication.body_without_html,
            unread_count: 0,
            trashed: communication.trashed_at.present?
          }

        elsif acc[key][:created_at] < communication.created_at
          acc[key][:created_at] = communication.created_at
          acc[key][:body] = communication.body_without_html
        end

        acc[key][:unread_count] += 1 if unread
        acc[key][:two_way] ||= two_way
      end

      acc
    end

    # Add New Maintenance Requests
    if !current_user.is_resident?
      MaintenanceRequest.for_user(current_user).where(status: MaintenanceRequest::STATUS_OPENED).where(["created_at > :current_sign_in_at", { current_sign_in_at: current_user.current_sign_in_at }]).each do | new_maintenance_request |

        key = "#{new_maintenance_request.class}:#{new_maintenance_request.id}"

        # Add this only if we haven't already accounted for this maintenance request
        if conversations[key].nil?
          conversations[key] = {
            id: new_maintenance_request.hash_id,
            property_id: new_maintenance_request.property_id,
            related_object_type: new_maintenance_request.class.to_s,
            created_at: new_maintenance_request.created_at,
            two_way: true,
            unread_count: 1,
            trashed: false
          }
        end
      end
    end

    #
    # Organize into the groups:
    # inbox, sent, trash, maintenance_requests, system_email
    #
    groups = conversations.keys.inject({}) do | acc, key|
      conversation = conversations[key]

      if key.starts_with?("SystemEmail")
        key = "system_email"
      elsif conversation[:related_object_type] == MaintenanceRequest.to_s
        key = "maintenance_requests"
      elsif conversation[:trashed]
        key = "trash"
      elsif !conversation[:two_way]
        key = "sent"
      else
        key = "inbox"
      end

      if acc[key].nil?
        acc[key] = {id: key, conversations: []}
      end

      acc[key][:conversations] << conversation

      acc
    end

    render_json({ conversation_groups: groups  })
  end

  def mark_comment_read

  end

  def mark_conversation_read
    conditions = {read_at: nil}

    if params[:related_object_type] == "LeaseResident"
      conditions[:related_object_type] = ['Announcement', 'LeaseResident']
      conditions[:sub_type] = [Communication::SUB_TYPE_COMMUNICATIONS_CENTER, Communication::SUB_TYPE_ANNOUNCEMENT]
    elsif params[:related_object_type] == "MaintenanceRequest"
      conditions[:related_object] = MaintenanceRequest.where(hash_id: params[:id]).first
    else
      conditions[:id] = -1
    end

    if current_user.is_resident?
      conditions[:to_type] = Resident.to_s
    else
      conditions[:to_type] = Property.to_s
    end

    communications = Communication.for_user(current_user).where(conditions)

    success = communications.update({read_at: Time.now})

    render_json({communications: communications}, success)
  end


  protected

  def object_params
    params.require(:communication).permit(Communication.public_fields + [{mediums: []}])
  end

  def load_related_object
    if params[:related_object_type] == MaintenanceRequest.to_s
      @related_object = MaintenanceRequest.where(hash_id: params[:related_object_hash_id]).first
    elsif params[:related_object_type] == LeaseResident.to_s
      @related_object = LeaseResident.where(hash_id: params[:related_object_hash_id]).first
    elsif params[:related_object_type] == Lease.to_s
      @related_object = Lease.where(hash_id: params[:related_object_hash_id]).first
      @related_object ||= Lease.where(id: params[:related_object_hash_id]).first
    else
      # Just look up by ID
      klass = Object.const_get(params[:related_object_type])
      @related_object = klass.where(id: params[:related_object_hash_id]).first
    end
  end

  def generate_csv(objects)
    rows = [
      CSV.generate_line(["Activity", "Notes", "Date", "User"], {force_quotes: true})
    ]

    objects.each do | object |
      row = []

      row << object.subject
      row << object.body_without_html
      row << object.created_at.in_time_zone('US/Mountain').strftime("%m/%d/%Y %l:%M %p %Z")
      row << object.from.name

      rows << CSV.generate_line(row, {force_quotes: true})
    end

    rows.join("")
  end
end