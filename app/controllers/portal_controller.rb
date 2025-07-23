class PortalController < ApplicationController
  include ApplicationHelper

  def index

    @data = build_data_package()

    # Special case - unit listings need to be loaded for social sharing
    if request.path.include?("available-to-rent")
      @unit_listing = UnitListing.where(hash_id: request.path.split('/').last).first
    end

    if current_user
      if current_user.is_resident?
        @data[:currentUser] = current_user.to_builder("full").attributes!
        @data[:currentActualUser] = current_actual_user.to_builder("full").attributes!
        @data[:currentCompany] = !current_user.resident.leases.empty? ? current_user.resident.leases.first.company.to_builder.attributes! : Company.first
        @data[:offerInsurance] = true
      else
        redirect_to "/properties/list"
      end
    end
  end

  def invite
    # We may want to intercept this... so I am.
    if current_user.present?
      lease_resident = LeaseResident.where(hash_id: params[:id]).first

      if lease_resident&.lease.nil? || [Lease::STATUS_LEAD, Lease::STATUS_APPLICANT].include?(lease_resident.lease.status)
        redirect_to "/portal/applications/#{params[:id]}/edit"
      else
        redirect_to "/portal/leases/#{lease_resident.lease.hash_id}"
      end

    else
      # Has this been used to create an account already? If so, send them to sign in
      if LeaseResident.joins(:resident).where(hash_id: params[:id]).where.not(resident: {user_id: nil}).exists?
        redirect_to "/portal/applications/#{params[:id]}/edit"
      else
        redirect_to "/portal/sign_up/#{params[:id]}"
      end
    end
  end
end