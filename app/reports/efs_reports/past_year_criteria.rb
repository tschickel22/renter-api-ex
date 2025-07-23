class EfsReports::PastYearCriteria < EfsReports::EfsReportCriteria

  def validate(params)
    
    first_of_month = Date.today.at_beginning_of_month#(Date.today.year,Date.today.month,1)
    
    # Convert to actual dates
    params[:fixed_start_date] = (first_of_month - 11.months)
    params[:fixed_end_date] = (first_of_month + 1.months - 1)
    
    return true
    
  end
  
  def partial_name
    ''
  end
  
  def header_items(for_pdf = false, for_subscription_description = false)
    if for_subscription_description
      return ["Past Year"]
    else
      return ["#{@report.params[:fixed_start_date].strftime('%m/%d/%Y')} - #{@report.params[:fixed_end_date].strftime('%m/%d/%Y')}"] 
    end
  end
  
end