class EfsReports::CriteriaDatePicker < EfsReports::EfsReportCriteria
  def date_range_options     
    options = 
    [
  		['Today', 'today'],
  		['Yesterday', 'yesterday'],
  		['This Week', 'this_week'],
  		['Last 7 Days', 'last_7_days'],
      ['This Month', 'this_month'],
      ['Last Month', 'last_month'],
  		['Last 30 Days', 'last_30_days'],
      ['Last 12 Months', 'last_12_months'],
  		['This Year', 'this_year'],
      ['All-time', 'all_time'],
  		['Custom', 'custom']
	  ]

    return options
  end

  def validate(params)

    begin
      if params['end_date'].blank?
        end_date = DateTime.now.in_time_zone('US/Mountain').to_date
      else
        end_date = DateTime.strptime(params['end_date'], '%m/%d/%Y')
      end
    rescue
      @report.criteria_errors << 'Enter a date in mm/dd/yyyy format.'
      return false
    end

    # Adjust to include the entire day
    params['end_date'] = end_date
    params['end_date'] += 86399.0/86400.0

    return true
    
  end

  def header_items(for_pdf = false, for_subscription_description = false)
    return ["#{@report.params['end_date'].strftime('%m/%d/%Y')}"]
  end

  private 
  def to_datetime(dt)
    DateTime.new(dt.year, dt.month, dt.day)
  end
  
end