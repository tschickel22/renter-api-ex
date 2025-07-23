class EfsReports::CriteriaUnitStatus < EfsReports::EfsReportCriteria
  def self.criteria_id
    'unit_status'
  end

  def self.current(params)
    if !params[EfsReports::CriteriaUnitStatus.criteria_id].blank?
      params[EfsReports::CriteriaUnitStatus.criteria_id]
    else
      Unit::STATUS_OCCUPIED
    end
  end

  def self.where_sql(unit_status)
    if unit_status.blank? || unit_status == Unit::STATUS_OCCUPIED
      " AND units.status in ('#{Unit::STATUS_OCCUPIED}', '#{Unit::STATUS_VACANT_LEASED}') "
    elsif unit_status == Unit::STATUS_VACANT
      " AND (units.status in ('#{Unit::STATUS_VACANT}') or units.status IS NULL) "
    else
      ""
    end
  end

  def validate(params)
    return true
  end

  def header_items(_for_pdf = false, for_subscription_description = false)
    if @report.params[EfsReports::CriteriaUnitStatus.criteria_id].blank? || @report.params[EfsReports::CriteriaUnitStatus.criteria_id] == Unit::STATUS_OCCUPIED
      return ["Occupied"]
    elsif @report.params[EfsReports::CriteriaUnitStatus.criteria_id] == Unit::STATUS_VACANT
      return ["Vacant"]
    else
      return ["All Units"]
    end
  end
end
