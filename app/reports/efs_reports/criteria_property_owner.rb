class EfsReports::CriteriaPropertyOwner < EfsReports::EfsReportCriteria
  def self.criteria_id
    'property_owner_id'
  end

  def self.current(params)
    if !params[EfsReports::CriteriaPropertyOwner.criteria_id].blank?
      params[EfsReports::CriteriaPropertyOwner.criteria_id]
    else
      '-1'
    end
  end

  def self.where_sql(property_owner_id)
    if "#{property_owner_id}" == "-1"
      "" # Everything
    elsif "#{property_owner_id}" == "-2"
      " AND property_owners.id IS NULL " # Company-level Only
    elsif "#{property_owner_id}" == "-3"
      " AND property_owners.id IS NOT NULL " # All Property Owners
    elsif !property_owner_id.blank?
      " AND property_owners.id = #{property_owner_id.to_i} "
    else
      ""
    end
  end

  def validate(params)
    return true
  end

  def header_items(_for_pdf = false, _for_subscription_description = false)

    if @report.params[EfsReports::CriteriaPropertyOwner.criteria_id].blank? || @report.params[EfsReports::CriteriaPropertyOwner.criteria_id].to_s == "-1"
      return [newLabel = "All Owners"]
    else
      property_owner = @report.current_user.company.property_owners.find(@report.params[EfsReports::CriteriaPropertyOwner.criteria_id].to_i)

      if property_owner.present?
        return ["Owner: #{property_owner.name}"]
      else
        return ["No Owner Selected"]
      end
    end
  end
end