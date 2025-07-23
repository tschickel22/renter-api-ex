module SentryHelper
  def user_attributes_for_logging
    return {} unless current_user.present?
    user_attributes = {
      id: current_user.hash_id,
      user_type: current_user.user_type
    }
    if current_user.company_id.present?
      user_attributes[:company_id] = current_user.company_id
    end

    user_attributes
  end
end
