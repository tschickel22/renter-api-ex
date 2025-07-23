class Api::UserRolesController < Api::ApiController

  def model_class
    UserRole
  end

  def handle_before_create_save
    if @object.user_type.blank?
      @object.user_type = User::TYPE_COMPANY_USER
      @object.listings = UserRole::ACCESS_LEVEL_VIEW
      @object.screening = UserRole::ACCESS_LEVEL_VIEW
      @object.expenses = UserRole::ACCESS_LEVEL_VIEW
      @object.payments = UserRole::ACCESS_LEVEL_VIEW
      @object.maintenance_requests = UserRole::ACCESS_LEVEL_VIEW
      @object.reports = UserRole::ACCESS_LEVEL_VIEW
      @object.users = UserRole::ACCESS_LEVEL_VIEW
      @object.communication = UserRole::ACCESS_LEVEL_VIEW
      @object.properties = UserRole::ACCESS_LEVEL_VIEW
      @object.vendors = UserRole::ACCESS_LEVEL_VIEW
      @object.settings = UserRole::ACCESS_LEVEL_VIEW
    end

    @object.update_get_email_flags()
  end

  def handle_before_update_save
    @object.update_get_email_flags()
  end

  def search
    user_roles = UserRole.for_user(current_user)
    user_roles = user_roles.where(["name like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?
    user_roles = user_roles.order(Arel.sql("CASE WHEN name = 'Company Admin' THEN 'A' ELSE name END"))

    user_roles, total = page(user_roles)

    render_json({ plural_object_key() => user_roles.collect{|u| u.to_builder(true).attributes! }, total: total  })
  end

  protected

  def primary_key_field
    :hash_id
  end

  def object_params
    pp = params.require(:user_role).permit(UserRole.public_fields()) || {}

    return pp
  end

end