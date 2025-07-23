class Api::HistoriesController < Api::ApiController
  def search
    histories = nil

    dates = parse_mmddyy_param(params, [:start_date, :end_date])

    start_date = dates[:start_date] if dates[:start_date].present?
    end_date = dates[:end_date] + 1.day if dates[:end_date].present?

    # Right now, there are two ways to get at this data: by user and by lease
    if params[:mode] == "user"
      histories = HistoriesService.new.user_history_logs(User.for_user(current_user).where(hash_id: params[:user_id]).first, current_actual_user, start_date, end_date)
    elsif params[:mode] == "lease"
      histories = HistoriesService.new.lease_history_logs(Lease.for_user(current_user).where(hash_id: params[:lease_id]).first, current_actual_user, start_date, end_date)
    elsif params[:mode] == "property"
      histories = HistoriesService.new.property_history_logs(Property.for_user(current_user).where(id: params[:property_id]).first, current_actual_user, start_date, end_date)
    elsif params[:mode] == "company"
      company = params[:company_id] == "my" ? current_user.company : Company.for_user(current_user).where(hash_id: params[:company_id]).first
      histories = HistoriesService.new.company_history_logs(company, current_actual_user, start_date, end_date)
    end

    changesets = histories.all_changesets

    if "#{params[:include_system_changes]}" != "true"
      changesets = changesets.filter{|z| z[:user_id].present? }
    end

    render_json(histories: changesets)
  end
end