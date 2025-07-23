class EfsReports::ReportCustomizationCriteria < EfsReports::EfsReportCriteria

  def self.options(report)
    [ReportCustomization.new(id:-1, name:'Default')] + (ReportCustomization.where(user_id: report.current_user.id, report_class: report.report_class)|| []).to_ary
  end

  def self.criteria_id
    return 'report_customization_id'
  end

  def current_params(session)
    params = Hash.new

    # Exctract the key params from the report
    params[EfsReports::ReportCustomizationCriteria::criteria_id] = @report.params[EfsReports::ReportCustomizationCriteria::criteria_id]

    return params
  end

  def validate(params)
    return true
  end


  def header_items(for_pdf = false, for_subscription_description = false)

    # Create a nicely-formatted string for the header
    description = ""

    if (@report.params[EfsReports::ReportCustomizationCriteria.criteria_id] || -1).to_i == -1
      description = 'Layout: Default</a>&nbsp;&nbsp;<a href="javascript:void(0);" class="btn btn-info" id="customize-report-link" onclick="showReportCustomization(\''+@report.report_id+'\', \''+(@report.params[EfsReports::ReportCustomizationCriteria::criteria_id] || 0).to_s+'\', null);"><i class="fa fa-pencil"></i> Customize Layout'
    else
      layout = ReportCustomization.where(user_id: report.current_user.id, report_class: report.report_class, id: @report.params[EfsReports::ReportCustomizationCriteria.criteria_id]).first

      description = 'Layout: '+layout.name+'</a>&nbsp;&nbsp;<a href="javascript:void(0);" class="btn btn-info" id="customize-report-link" onclick="showReportCustomization(\''+@report.report_id+'\', \''+(@report.params[EfsReports::ReportCustomizationCriteria::criteria_id] || 0).to_s+'\', null);"><i class="fa fa-pencil"></i> Edit Layout'
    end

    # If we're interactive, create JavaScript to show an on-page drop-down
    if !for_pdf && @report.current_user.present?
      return create_on_report_drop_down(menu_id = 'criteria-layouts', EfsReports::ReportCustomizationCriteria.criteria_id, EfsReports::ReportCustomizationCriteria.options(@report), description)
    else
      return ['']
    end
  end
end