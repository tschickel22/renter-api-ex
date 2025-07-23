class Api::MaintenanceRequestsController < Api::ApiController
  before_action :set_maintenance_request, only: [:upload_photos, :destroy_photos, :photos]
  skip_before_action :verify_authenticity_token, only: :upload_photos

  def model_class
    MaintenanceRequest
  end

  def primary_key_field
    :hash_id
  end

  def show
    if params[:edit_mode] == "vendor_edit"
      render_json({ singular_object_key() => MaintenanceRequest.where(hash_id: params[:id]).first })
    else
      super
    end
  end

  def load_object_for_update()
    if params[:edit_mode] == "vendor_edit"
      @object = MaintenanceRequest.where(hash_id: params[:id]).first
    else
      super
    end
  end

  def handle_before_create
    @object.status = MaintenanceRequest::STATUS_OPENED
    @object.submitted_on = todays_date()
    @object.submitted_by_id = current_user.id

    # If this is a resident, we must fill in a lot of blanks
    if current_user.is_resident?
      if current_user.resident.leases.count == 1
        lease = current_user.resident.leases.first
      else
        lease = current_user.resident.leases.current.last
      end

      @object.company_id = lease.company_id
      @object.property_id = lease.property_id
      @object.unit_id = lease.unit_id
      @object.resident_id = current_user.resident.id
    end
  end

  def handle_after_create

    # Move over any unattached photos
    if @object.photos_batch_number.present?
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: @object.photos_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = MaintenanceRequest.to_s
          f.record_id = @object.id
          f.name = "photos"
          f.save
        end
      end
    end

    # Now, send notifications
    if @object.submitted_by.is_resident?
      CompanyMailer.send_to_appropriate_users(:renter_submitted_maintenance_request, @object.property, @object.id)
      ResidentMailer.maintenance_request_submitted(@object.id).deliver

    # Try to look up the resident
    else
      lease = Lease.where(property_id: @object.property_id, unit_id: @object.unit_id).current.last
      lease = Lease.where(property_id: @object.property_id, unit_id: @object.unit_id).future.last if lease.nil?

      if lease.present?
        @object.update({resident_id: lease.primary_resident.resident_id}) if lease.primary_resident.present?

        if !@object.internal_ticket && !@object.is_recurring?
          ResidentMailer.maintenance_request_submitted_by_property(@object.id).deliver
        end
      end
    end

    if @object.assigned_to.present? && !params[:maintenance_request][:send_notification].blank?
      deliver_company_notifications()
    end
  end

  def handle_after_update
    if @object.saved_change_to_attribute?(:status)
      if @object.is_open?
        @object.closed_on = nil
        @object.vendor_completed_on = nil
        @object.save
      elsif @object.is_vendor_completed?
        @object.vendor_completed_on = Time.now
        @object.save

        CompanyMailer.send_to_appropriate_users(:maintenance_request_vendor_completed_work, @object.property, @object.id)

      elsif @object.is_closed?
        close_ticket()
      end
    end

    if @object.saved_change_to_attribute?(:assigned_to_id) && @object.assigned_to.present? && !params[:maintenance_request][:send_notification].blank?
      deliver_company_notifications()

      if !@object.internal_ticket && !@object.is_recurring?
        deliver_resident_notifications()
      end
    end
  end

  def deliver_company_notifications
    if params[:maintenance_request][:send_notification].include?("email")
      CompanyMailer.maintenance_request_assigned(@object.id).deliver
    end

    if params[:maintenance_request][:send_notification].include?("text")
      CompanyTexter.new.maintenance_request_assigned(@object.id)
    end
  end

  def deliver_resident_notifications
    if params[:maintenance_request][:send_notification].include?("email")
      ResidentMailer.maintenance_request_assigned(@object.id).deliver
    end
  end

  def perform_search(maintenance_requests)
    maintenance_requests = maintenance_requests.where(["title like :search_text or description like :search_text", {search_text: "%#{params[:search_text]}%"}])
    maintenance_requests = maintenance_requests.where("recurring_frequency IS NULL OR recurring_frequency = ''") if params[:exclude_recurring] === true
    maintenance_requests = maintenance_requests.where("internal_ticket IS NULL OR internal_ticket = 0") if current_user.is_resident?
    maintenance_requests = maintenance_requests.where.not(status: MaintenanceRequest::STATUS_CLOSED) if params[:status] == "open"
    maintenance_requests = maintenance_requests.where(urgency: MaintenanceRequest::URGENCY_URGENT).where.not(status: MaintenanceRequest::STATUS_CLOSED) if params[:status] == "open_urgent"
    maintenance_requests = maintenance_requests.where(status: MaintenanceRequest::STATUS_VENDOR_COMPLETE) if params[:status] == "vendor_complete"
    maintenance_requests = maintenance_requests.where(status: MaintenanceRequest::STATUS_CLOSED) if params[:status] == "closed"

    # Add in some includes to cut down the number of queries
    maintenance_requests = maintenance_requests.includes(:unit, :assigned_to, :submitted_by, :resident, :property, :maintenance_request_category, :expenses)

    # Grab a count of unread comments
    communications = Communication.where({to_type: (current_user.is_resident? ? Resident : Property), read_at: nil, related_object_type: MaintenanceRequest, related_object_id: maintenance_requests.collect{|q| q.id}})

    unread_by_maintenance_request = communications.inject({}) do | acc, communication |
      acc[communication.related_object_id] =  (acc[communication.related_object_id] || 0) + 1
      acc
    end

    maintenance_requests.each do | maintenance_request |
      maintenance_request.unread_comments = unread_by_maintenance_request[maintenance_request.id] || 0
    end

    return maintenance_requests
  end

  def assignees
    vendors = Vendor.for_user(current_user)
    users = User.where(company_id: current_user.company_id, user_type: [User::TYPE_COMPANY_ADMIN])

    assignee_options = vendors.collect{|v| {id: "Vendor:#{v.id}", name: v.name, email: v.email, phone_number: v.phone_number}}
    assignee_options+= users.collect{|u| {id: "User:#{u.id}", name: u.full_name, email: u.email, phone_number: u.phone_number}}

    assignee_options = assignee_options.sort_by{|a| a[:name]}

    render_json({assignees: assignee_options}, true)
  end

  def close
    load_object_for_update

    if close_ticket
      render_successful_update()
    else
      render_failed_update()
    end
  end

  def close_ticket
    @object.status = MaintenanceRequest::STATUS_CLOSED
    @object.closed_on = todays_date()

    if @object.save

      CompanyMailer.send_to_appropriate_users(:maintenance_request_closed, @object.property, @object.id)
      ResidentMailer.maintenance_request_closed(@object.id).deliver if @object.resident.present?

      return true
    else
      return false
    end
  end

  def print
    @maintenance_request = MaintenanceRequest.where(hash_id: params[:id]).first
    @user = current_user
    render partial: 'company_mailer/maintenance_request_info', locals: {hide_buttons: 'true' == params[:hide_buttons]}
  end

  def photos
    render_photos_json()
  end

  def destroy_photos
    @maintenance_request.photos.where(id: params[:photo_id]).purge
    render_photos_json()
  end

  def upload_photos

    file_params = params.permit(:id, :photos, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: MaintenanceRequest.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:photos])
      unattached_file_batch.save

      photos = unattached_file_batch.files.collect{|ip| MaintenanceRequest.photo_builder(ip).attributes!}
      render_json({ photos: photos  })

    elsif @maintenance_request.present?
      @maintenance_request.photos.attach(params.permit(:photos)[:photos])

      if @maintenance_request.save(validate: false)
        render_photos_json()
      else
        render_json({errors: extract_errors_by_attribute(@maintenance_request)}, false)
      end
    else
      render_json({errors: ["Maintenance Request not found"]}, false)
    end
  end

  protected

  def set_maintenance_request
    @maintenance_request = MaintenanceRequest.where(hash_id: params[:id]).first
  end

  def object_params

    mrp = params.require(:maintenance_request).permit(MaintenanceRequest.public_fields + [:assigned_to_type_and_id, :photos_batch_number])

    if current_user.nil? || current_user.is_resident?
      mrp.delete(:property_id)
      mrp.delete(:unit_id)
    end

    # Split type and id into two
    if !mrp[:assigned_to_type_and_id].blank?
      mrp[:assigned_to_type] = mrp[:assigned_to_type_and_id].split(':').first
      mrp[:assigned_to_id] = mrp[:assigned_to_type_and_id].split(':').last
    else
      mrp[:assigned_to_type] = nil
      mrp[:assigned_to_id] = nil
    end

    # Clean up booleans
    # NECESSARY? mrp[:permission_to_enter] = (mrp[:permission_to_enter].to_s == "true") if !mrp[:permission_to_enter].blank?
    # NECESSARY? mrp[:pets_in_unit] = (mrp[:pets_in_unit].to_s == "true") if !mrp[:pets_in_unit].blank?

    mrp.delete(:assigned_to_type_and_id)

    return mrp
  end

  def render_photos_json
    photos = @maintenance_request.present? ? @maintenance_request.photos.collect{|ip| MaintenanceRequest.photo_builder(ip).attributes!} : []
    render_json({ photos: photos  })
  end
end