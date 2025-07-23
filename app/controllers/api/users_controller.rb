class Api::UsersController < Api::ApiController

  def model_class
    User
  end

  def setup_new_object()
    new_user = User.new(company_id: current_user.company_id)

    # Fake the password
    pw = SecureRandom.random_number
    new_user.password = pw
    new_user.password_confirmation = pw
    new_user.confirmed_at = Time.now

    return new_user
  end

  def show
    render_json({ user: User.for_user(current_user).where(hash_id: params[:id]).first.to_builder("full").attributes! })
  end

  def handle_before_create
    update_user_type()
  end

  def handle_before_update
    update_user_type()
  end

  def update_user_type
    # Is the role changing? If so, make sure the user_type lines up
    if @object.user_role_id != params[:user][:user_role_id] || @object.user_type.nil?
      user_role = UserRole.where(id: params[:user][:user_role_id]).first

      @object.user_type = user_role.user_type if user_role.present?
    end
  end

  def handle_after_create
    update_user_assignments()

    # Send Welcome email
    CompanyMailer.welcome_new_user(@object.id).deliver!
  end

  def handle_after_update
    update_user_assignments()
  end

  def update_user_assignments
    if @object.is_company_user?
      if !params[:user][:property_ids].blank?
        property_ids = params[:user][:property_ids].split(",").collect{|pid| pid.to_i}
        property_ids_to_add = property_ids - @object.property_ids
        property_ids_to_delete = @object.property_ids - property_ids

        property_ids_to_add.each do | property_id |
          UserAssignment.create(user_id: @object.id, entity_id: property_id, entity_type: Property.to_s)
        end

        UserAssignment.where(user_id: @object.id, entity_id: property_ids_to_delete, entity_type: Property.to_s).destroy_all

        @object.reload
      elsif !params[:user][:property_owner_ids].blank?
        property_owner_ids = params[:user][:property_owner_ids].split(",").collect{|pid| pid.to_i}
        property_owner_ids_to_add = property_owner_ids - @object.property_owner_ids
        property_owner_ids_to_delete = @object.property_owner_ids - property_owner_ids

        property_owner_ids_to_add.each do | property_owner_id |
          UserAssignment.create(user_id: @object.id, entity_id: property_owner_id, entity_type: PropertyOwner.to_s)
        end

        UserAssignment.where(user_id: @object.id, entity_id: property_owner_ids_to_delete, entity_type: PropertyOwner.to_s).destroy_all

        @object.reload
      end
    end
  end

  def search
    users = User.for_user(current_user)
    users = users.joins("LEFT OUTER JOIN companies on companies.id = users.company_id").where(["companies.name like :search_text or email like :search_text or first_name like :search_text or last_name like :search_text or concat(first_name,' ', last_name) like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?
    users = users.joins(:user_role).where(user_role: {name: params[:user_role_name]}) if !params[:user_role_name].blank?
    users = users.order(:user_type)

    users, total = page(users)

    render_json({ users: users.collect{|u| u.to_builder("partial").attributes! }, total: total  })
  end

  def destroy
    load_object_for_update

    if @object.present? && @object.destroy
      render_successful_update()
    else
      render_failed_update
    end
  end

  def upgrade_subscription
    if current_user.is_company_admin_at_least?
      if [RenterInsightZohoApi::PLAN_CODE_MONTHLY_UPGRADE, RenterInsightZohoApi::PLAN_CODE_YEARLY_UPGRADE].include?(params[:plan_code])
        # Call Zoho and update the plan code
        result = RenterInsightZohoApi.new.update_subscription(current_user.company.external_subscription_id, params[:plan_code])

        if result
          if result[:code] == 0

            new_subscription_frequency = params[:plan_code] == RenterInsightZohoApi::PLAN_CODE_YEARLY_UPGRADE ? Company::SUBSCRIPTION_FREQUENCY_YEARLY : Company::SUBSCRIPTION_FREQUENCY_MONTHLY

            current_user.company.update({external_subscription_plan_code: params[:plan_code], subscription_frequency: new_subscription_frequency})

            render_json({message: result[:message]}, true)
          else
            render_json({errors: {base: result[:message]}}, false)
          end
        else
          render_json({errors: {base: "Unable to upgrade account. Please contact support."}}, false)
        end

      else
        render_json({errors: {base: "Unrecognized Plan Code"}}, false)
      end
    else
      render_json({errors: {base: "Please ask your company admin to upgrade your account."}}, false)
    end
  end


  protected

  def primary_key_field
    :hash_id
  end

  def object_params
    pp = params.require(:user).permit(User.public_fields()) || {}

    return pp
  end

end