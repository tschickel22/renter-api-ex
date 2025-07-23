class Admin::UsersController < Admin::SecuredController
  before_action :set_user

  def proxy
    # Must be logged in as admin first
    unless proxied_in?
      self.current_proxy_user = current_user
    end

    #
    # Fake a Devise login by updating the session vars
    #
    request.env['rack.session']['warden.user.user.key'] = [[@user.id], @user.encrypted_password[0,29]]

    if proxied_in? && current_proxy_user == @user
      self.current_proxy_user = nil
    else
      # UserActivity.log(@user, current_proxy_user, UserActivity::ACTIVITY_PROXY, request)
    end

    redirect_to params[:return_url] || root_path
  end

  def proxy_as_company_admin
    company_admin = User.where(company_id: params[:id], user_type: User::TYPE_COMPANY_ADMIN).first

    if company_admin.present?
      redirect_to proxy_admin_user_path(company_admin, return_url: params[:return_url])
    else
      redirect_to root_path
    end
  end

  private

  def set_user
    @user = User.where(id: params[:id]).first
  end

end
