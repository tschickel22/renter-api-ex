class Api::AnnouncementsController < Api::ApiController
  include ApplicationHelper
  skip_before_action :verify_authenticity_token, only: [:upload_attachments]

  def model_class
    Announcement
  end

  def primary_key_field
    :hash_id
  end

  def show
    if current_user&.is_resident?
      # Make sure this resident was a recipient of this Announcement
      announcement = Announcement.where(hash_id: params[:id]).first
      communication = Communication.where(related_object: announcement, resident_id: current_user.resident.id).first

      if communication.present?
        announcement.body = communication.body.gsub("\n", '<br/>')
        render_json({ singular_object_key() => announcement })
      else
        render_json({ singular_object_key() => nil })
      end
    else
      super
    end
  end

  def handle_before_create_save
    @object.status = Announcement::STATUS_DRAFT
    @object.sent_by_user_id = current_user.id

    handle_before_save()
  end

  def handle_after_create
    # Move over any unattached photos
    if @object.attachments_batch_number.present?
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: @object.attachments_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = Announcement.to_s
          f.record_id = @object.id
          f.name = "attachments"
          f.save
        end
      end
    end
  end

  def handle_before_update_save
    handle_before_save()
  end

  def handle_before_save
    @object.send_at = Time.now if @object.send_at.nil?
  end

  def perform_search(announcements)
    announcements.where(["subject like :search_text", {search_text: "%#{params[:search_text]}%"}])
  end

  def recipient_lease_residents
    load_object_for_update()

    recipients = @object.determine_recipient_lease_residents(params[:search_text])

    render_json({lease_residents: recipients.collect{|r| r.to_builder("inverse").attributes!}}, true)
  end

  def save_recipients
    load_object_for_update()

    if @object.status == Announcement::STATUS_SENT
      render_json({errors: {base: "Announcement already sent"}}, false)

    elsif params[:announcement].present? && !params[:announcement][:announcement_recipients].blank?

      @object.assign_attributes(announcement_recipient_params())
      @object.save

      render_successful_update()

    else
      render_json({errors: {base: "No recipients selected"}}, false)
    end
  end

  def queue_for_delivery
    load_object_for_update()

    if @object.status == Announcement::STATUS_SENT
      render_json({errors: {base: "Announcement already sent"}}, false)

    else
      @object.status = Announcement::STATUS_QUEUED
      @object.sent_by_user_id = current_user.id
      @object.save

      # Send right now?
      if @object.send_when == Announcement::SEND_WHEN_IMMEDIATELY
        DeliverAnnouncement.enqueue(@object)
      end

      render_successful_update()

    end
  end

  def clone
    existing_announcement = Announcement.for_user(current_user).where(hash_id: params[:id]).first

    @object = Announcement.new(existing_announcement.slice(Announcement.public_fields + [:company_id]))
    @object.status = Announcement::STATUS_DRAFT
    @object.send_when = nil
    @object.send_at = nil

    # Copy over the recipients
    existing_announcement.announcement_recipients.each do | announcement_recipient |
      @object.announcement_recipients << AnnouncementRecipient.new(announcement_recipient.slice(AnnouncementRecipient.public_fields))
    end

    # Copy over the attachments
    existing_announcement.attachments.each do |original_file|
      @object.attachments.attach(io: StringIO.new(original_file.download), filename: original_file.filename, content_type: original_file.content_type)
    end

    if @object.save(validate: false)
      render_successful_create()
    else
      render_json({errors: extract_errors_by_attribute(@object)}, false)
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

  def attachments
    
    if current_user&.is_resident?
      # Make sure this resident was a recipient of this Announcement
      announcement = Announcement.where(hash_id: params[:id]).first
      communication = Communication.where(related_object: announcement, resident_id: current_user.resident.id).first

      if communication.present?
        @object = announcement
      end
    else
      load_object_for_update()
    end

    render_attachments_json()
  end

  def destroy_attachment
    load_object_for_update()
    @object.attachments.where(id: params[:attachment_id]).purge
    render_attachments_json()
  end

  def upload_attachments
    file_params = params.permit(:id, :attachment, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: Announcement.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:attachment])
      unattached_file_batch.save

      attachments = unattached_file_batch.files.collect{|ip| Announcement.attachment_builder(ip).attributes!}
      render_json({ attachments: attachments  })
    else
      load_object_for_update()

      if @object.present?
        @object.attachments.attach(params.permit(:attachment)[:attachment])

        if @object.save
          render_attachments_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["Announcement not found"]}, false)
      end
    end
  end

  protected

  def object_params
    params.require(:announcement).permit(Announcement.public_fields + [:attachments_batch_number, mediums: []])
  end

  def announcement_recipient_params
    arp = {announcement_recipients_attributes: params.require(:announcement).permit([announcement_recipients: [[:id, recipient_conditions: {}] + AnnouncementRecipient.public_fields()]])[:announcement_recipients]}

    check_for_removals(arp[:announcement_recipients_attributes], @object.announcement_recipients)

    return arp
  end

  def render_attachments_json
    attachments = @object.attachments.collect{|ip| Announcement.attachment_builder(ip).attributes!} if @object.present?
    render_json({ attachments: attachments  })
  end
end