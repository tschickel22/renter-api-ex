class ConfirmationsController < Devise::ConfirmationsController
  include ApplicationHelper

  def after_confirmation_path_for(resource_name, resource)
    return "/dashboard_users/sign_in"
  end

  # http://localhost:3000/users/confirmation?confirmation_token=U5Che_G34ZW6FQaDchBy
  def show
    self.resource = resource_class.confirm_by_token(params[:confirmation_token])
    yield resource if block_given?

    if resource.errors.empty?
      # Is this a new trial starting?
      if resource.is_company_admin?
        RenterInsightImpactApi.new.create_conversion(resource.company)
      end

      sign_in(resource)
    end

    if current_user.present?
      redirect_to "/properties/list"
    else
      redirect_to "/dashboard_users/sign_in"
    end
  end

end
