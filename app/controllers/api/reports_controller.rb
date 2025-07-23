class Api::ReportsController < Api::ApiController

  def run
    # The name of the report is passed in the URL:
    # /api/internal/reports/activity_detail/run
    user = current_user
    real_user = current_actual_user
    report_subscription = ReportSubscription.where(id: params[:report_subscription_id], user_id: current_user.id).first
    report_params = get_report_params()

    klass = get_class(params[:id])

    if report_params.present?
      report_customization = nil
      # TODO report_customization = ReportCustomization.where({id: report_params[:report_customization_id], report_class: params[:id], user_id: user.id}).first
      # TODO report_params[:report_customization_id] = nil if report_customization.nil?
    end

    report = klass.new({user: user, real_user: real_user, params: report_params, report_id: params[:id], report_customization: report_customization, report_subscription: report_subscription})

    if report.admins_only
      raise "Permission Denied", :unauthorized if !user.is_admin?
      report_is_valid = user.is_admin? && report.validate()
    else
      report_is_valid = user.user_role.can_view_reports && report.validate()
    end

    report.run_report(report_is_valid)

    if !report_is_valid
      render_json({report: report.to_builder.attributes!}, success = false)
    else
      if params[:format] == "csv"
        report.generate_csv()
        render_json({csv: report.output})
      else
        render_json({report: report.to_builder.attributes!})
      end
    end
  end

  private

  def get_report_params
    return {} if params[:report].nil?
    return params[:report].permit!
  end

  def get_class(id)
    "RiReports::#{id.camelcase}".constantize
  end

end