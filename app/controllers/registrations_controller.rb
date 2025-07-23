class RegistrationsController < Devise::RegistrationsController
  include ApplicationHelper

  before_action :update_sanitized_params

  def update_sanitized_params
    devise_parameter_sanitizer.permit(:sign_up) {|u| u.permit(:first_name, :last_name, :email, :password, :user_type, :cell_phone)}
  end

  def create
    su_params = sign_up_params.merge!({agreement_at: Time.now, agreement_ip_address: request.remote_ip})

    build_resource(su_params)

    if resource.is_resident?
      # No need to confirm this account... they couldn't have reached us without the email
      resource.confirmed_at = Time.now
      resource.confirmation_sent_at = Time.now
    end

    resource.save

    if resource.persisted?

      # Now that the user account exists, set up company and property owner
      if resource.is_company_admin_at_least?
        company_params = params.require(:user).permit(:company_name, :number_of_units, :cell_phone, :affiliate_click_code)
        company = Company.create(name: company_params[:company_name], number_of_units: company_params[:number_of_units], affiliate_click_code: company_params[:affiliate_click_code])
        Account.build_out_for_company(company)

        # Set the right role
        company_admin_role = UserRole.where(company_id: company.id, name: UserRole::NAME_COMPANY_ADMIN).first
        resource.update({company_id: company.id, user_role_id: company_admin_role.id})

        PropertyOwner.create({company_id: company.id, name: "#{resource.first_name} #{resource.last_name}", owner_type: PropertyOwner::OWNER_TYPE_INDIVIDUAL})

        PushCompanyToCrm.enqueue(company.id)
        PushUserToCrm.enqueue(resource.id)

        # Send a welcome text too
        CompanyTexter.new.confirmation_instructions(resource.id)

      elsif resource.is_resident?

        # Link the resident up with the new user account
        lease = Lease.where(hash_id: params[:lease_id]).first
        resident = Resident.where(hash_id: params[:resident_id]).first
        resident.update({email: resource.email, user_id: resource.id})

        # Bump the application onto the first step... if this lease isn't already current
        lease_resident = LeaseResident.where(lease_id: lease.id, resident_id: resident.id).first

        if [Lease::STATUS_LEAD, Lease::STATUS_APPLICANT].include?(lease.status)
          lease_resident.update({current_step: LeaseResident::STEP_OCCUPANT_DETAILS})
        end
      end

      data = {success: true, new_csrf: form_authenticity_token}

      if resource.active_for_authentication?
        sign_up(resource_name, resource)

        data[:currentUser] = resource.to_builder.attributes!

        render json: data

      else
        expire_data_after_sign_in!

        data[:waitingOnConfirmation] = true

        render json: data
      end
    else
      data = {success: false, errors: extract_errors_by_attribute(resource)}
      render json: data
    end

  end

end
