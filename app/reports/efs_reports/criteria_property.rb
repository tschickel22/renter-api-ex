class EfsReports::CriteriaProperty < EfsReports::EfsReportCriteria
  def self.criteria_id
    'property_id'
  end

  def self.current(params)
    if !params[EfsReports::CriteriaProperty.criteria_id].blank?
      params[EfsReports::CriteriaProperty.criteria_id]
    else
      '-1'
    end
  end

  def self.where_sql(property_id)
    if "#{property_id}" == "-1"
      "" # Everything
    elsif "#{property_id}" == "-2"
      " AND properties.id IS NULL " # Company-level Only
    elsif "#{property_id}" == "-3"
      " AND properties.id IS NOT NULL " # All Properties
    elsif !property_id.blank?
      " AND properties.id = #{property_id.to_i} "
    else
      ""
    end
  end

  def validate(params)
    return true
  end

  def header_items(_for_pdf = false, _for_subscription_description = false)

    if @report.params[EfsReports::CriteriaProperty.criteria_id].blank? || @report.params[EfsReports::CriteriaProperty.criteria_id].to_s == "-1"
      return [ "Everything"]
    elsif @report.params[EfsReports::CriteriaProperty.criteria_id].to_s == "-2"
      return ["Company-Level Only"]
    elsif @report.params[EfsReports::CriteriaProperty.criteria_id].to_s == "-3"
      return [newLabel = "All Properties"]
    else
      property = @report.current_user.company.properties.find(@report.params[EfsReports::CriteriaProperty.criteria_id].to_i)

      if property.present?
        return ["Property: #{property.name}"]
      else
        return ["No Property Selected"]
      end
    end
  end
end