class EfsReports::CriteriaDateRange < EfsReports::EfsReportCriteria
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
      ['Last Year', 'last_year'],
      ['All-time', 'all_time'],
  		['Custom', 'custom']
	  ]

    return options
  end

  def validate(params)

    if params['date_range_type'].blank? || params['date_range_type'] == 'custom'

      # First, check for basic entry
      params['start_date'] = 30.days.ago.strftime('%m/%d/%Y') if params['start_date'].blank?
      params['end_date'] = 0.days.ago.strftime('%m/%d/%Y') if params['end_date'].blank?
    
      # Next, convert each date string to actual dates
      begin
        start_date = DateTime.strptime(params['start_date'], '%m/%d/%Y')
        end_date = DateTime.strptime(params['end_date'], '%m/%d/%Y')
      rescue
        @report.criteria_errors << 'Enter both a start and end date in mm/dd/yyyy format.'
        return false      
      end
    
      if end_date < start_date
        @report.criteria_errors << 'The end date must be after the start date.'
        return false      
      end

      # Convert to actual dates
      params['start_date'] = start_date
      params['end_date'] = end_date

    elsif params['date_range_type'].blank?
        @report.criteria_errors << 'Select date range'
        return false
    else

      date_span = params['date_range_type']
      today = Date.today

      start_date = case
                      when date_span == 'today' then to_datetime(Date.today)
                      when date_span == 'this_week' then today - today.wday
                      when date_span == 'this_month' then to_datetime(today - today.day) + 1
                      when date_span == 'last_month' then to_datetime(today).beginning_of_month - 1.month
                      when date_span == 'this_year' then today - today.yday + 1
                      when date_span == 'yesterday' then to_datetime(today - 1)
                      when date_span == 'last_7_days' then to_datetime(today- 6)
                      when date_span == 'last_30_days' then to_datetime(today- 29)
                      when date_span == 'last_12_months' then to_datetime(today - 12.months)
                      when date_span == 'last_week' then today - today.wday - 7
                      when date_span == 'last_month' then today - today + 1 - 1.month
                      when date_span == 'last_year' then today - today.yday + 1 - 1.year
                      when date_span == '2_days_ago' then to_datetime(today- 2)
                      when date_span == 'all_time' then to_datetime(Date.new(1990,1,1))
                      end

      # Make dates a datetime
      params['start_date'] = start_date.instance_of?(DateTime) ? start_date : to_datetime(start_date)

      end_date = case
                      when date_span == 'today' then to_datetime(today)
                      when date_span == 'this_week' then to_datetime(today - today.wday) + 6
                      when date_span == 'this_month' then (today - today.day + 1) + 1.month - 1
                      when date_span == 'last_month' then to_datetime(today).beginning_of_month - 1
                      when date_span == 'this_year' then (today - today.yday) + 1.year
                      when date_span == 'yesterday' then today - 1
                      when date_span == 'last_7_days' then today
                      when date_span == 'last_30_days' then today
                      when date_span == 'last_12_months' then today
                      when date_span == 'last_week' then (today - today.wday) - 1
                      when date_span == 'last_month' then (today - today.day)
                      when date_span == 'last_year' then (today - today.yday)
                      when date_span == '2_days_ago' then today- 2
                      when date_span == 'all_time' then today.end_of_year
      end

      params['end_date'] = end_date.instance_of?(DateTime) ? end_date : to_datetime(end_date)
        
    end

    # Adjust to include the entire day
    params['end_date'] += 86399.0/86400.0

    return true
    
  end
  
  def header_items(for_pdf = false, for_subscription_description = false)

    unless for_pdf
      inline_form = '<span class="renter-insight-rangepicker pull-left">
                  <i class="fa fa-calendar"></i><input name="date_range_picker" type="text" class="rangepicker rangepicker-with-icon" data-format="mm/dd/yyyy" data-from="'+@report.params['start_date'].strftime('%m/%d/%Y')+'" data-to="'+@report.params['end_date'].strftime('%m/%d/%Y')+'" data-selected-range-target="input[name=date_range]" onchange="setTimeout(function(){updateDateRange(true);}, 300);">
                  <input name="date_range" type="hidden" value="'+@report.params['start_date'].strftime('%m/%d/%Y')+' - '+@report.params['end_date'].strftime('%m/%d/%Y')+'">
                </span>'
    end

    description = @report.params['date_range_type'] == 'all_time' ? 'All-time' : "#{@report.params['start_date'].strftime('%m/%d/%Y')} - #{@report.params['end_date'].strftime('%m/%d/%Y')}"

    if !for_pdf
      return [inline_form]
    elsif for_subscription_description
      date_range_option = date_range_options.select{|x| x[1] == @report.params['date_range_type']}
      return  date_range_option.count > 0 ? [date_range_option.first[0]] : []

    else
      return [description] 
    end

    
  end
  
  private 
  def to_datetime(dt)
    DateTime.new(dt.year, dt.month, dt.day)
  end
  
end