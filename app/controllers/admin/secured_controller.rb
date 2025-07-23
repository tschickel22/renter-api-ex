class Admin::SecuredController < ApplicationController
  include ApplicationHelper
  before_action :check_admin

  def check_admin
    redirect_with_message(__method__) if current_actual_user && !current_actual_user.is_admin?
  end

  private

  def redirect_with_message(code, msg = 'Not+Authorized', url = '/')
    redirect_to "#{url}?notice=#{msg}&code=#{code}"
  end

end