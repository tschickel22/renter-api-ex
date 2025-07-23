class EfsReports::CriteriaGroupByMethod < EfsReports::EfsReportCriteria
  def self.criteria_id
    'group_by_method'
  end

  def self.where_sql(group_by_method)
    if !group_by_method.blank? && group_by_method == "month"
      "month"
    else
      "property"
    end
  end

  def validate(params)
    return true
  end
end