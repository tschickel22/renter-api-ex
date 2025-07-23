class DashboardController < ApplicationController
  include ApplicationHelper

  def index
    if request.fullpath == "/"
      if current_user.present? && current_user.is_admin?
        redirect_to "/dashboard_users"
      else
        redirect_to "/dashboard"
      end
    else
      @data = build_data_package()

      if current_user
        @data[:currentUser] = current_user.to_builder("full").attributes!
        @data[:currentActualUser] = current_actual_user.to_builder("full").attributes!

        if current_user.is_resident?
          # This person is a resident... shouldn't be here
          redirect_to "/portal?from-dashboard=yes"
        else
          @data[:currentCompany] = current_user.company.to_builder.attributes!
        end
      end
    end
  end

  def export
    # Path is something like /export/checks-20240101-1234.pdf
    # 1234 is a payment hash... use this to validate that they have permission to see this file
    if current_user && !params[:filename].blank?
      check_hash_id = params[:filename].split('-').last

      if !check_hash_id.blank?
        if PrintedCheck.for_user(current_user).where(hash_id: check_hash_id).exists?
          send_data File.read("#{Rails.root}/export/#{params[:filename]}.pdf"), type: 'application/pdf', disposition: 'inline', filename: params[:filename]
          return
        end
      end
    end

    render plain: 'Access Denied'
  end
end