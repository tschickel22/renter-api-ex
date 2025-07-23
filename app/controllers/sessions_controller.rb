class SessionsController < Devise::SessionsController
  include ApplicationHelper

  def new
    redirect_to "/dashboard"
  end

  def create

    # Try to catch un-confirmed users
    if params[:user] && params[:user][:email]
      user = User.where(email: params[:user][:email]).first

      if user.present? && user.confirmed_at.nil?
        render json: {success: false, errors: ["Your email address is not confirmed. Please check your email for a link."]}
        return
      end
    end

    self.resource = warden.authenticate!(auth_options)
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource)
    data = {success: true}
    data[:currentUser] = resource.to_builder.attributes!

    if resource.is_resident?
      data[:currentCompany] = current_user.resident.leases.first.company.to_builder.attributes!
    else
      data[:currentCompany] = current_user.company.to_builder.attributes!
    end

    data[:new_csrf] = form_authenticity_token
    render json: data

  end

  def destroy
    signed_out= (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))

    data = {success: signed_out}
    data[:new_csrf] = form_authenticity_token

    render json: data

  end
end
