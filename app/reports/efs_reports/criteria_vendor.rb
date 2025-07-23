class EfsReports::CriteriaVendor < EfsReports::EfsReportCriteria
  def self.criteria_id
    'vendor_id'
  end

  def self.current(params)
    if !params[EfsReports::CriteriaVendor.criteria_id].blank?
      params[EfsReports::CriteriaVendor.criteria_id]
    else
      '-1'
    end
  end

  def self.where_sql(vendor_id)
    if "#{vendor_id}" == "-1"
      "" # Everything
    elsif "#{vendor_id}" == "-2"
      " AND vendors.id IS NULL " # Company-level Only
    elsif "#{vendor_id}" == "-3"
      " AND vendors.id IS NOT NULL " # All Vendors
    elsif !vendor_id.blank?
      " AND vendors.id = #{vendor_id.to_i} "
    else
      ""
    end
  end

  def validate(params)
    return true
  end

  def header_items(_for_pdf = false, _for_subscription_description = false)

    if @report.params[EfsReports::CriteriaVendor.criteria_id].blank? || @report.params[EfsReports::CriteriaVendor.criteria_id].to_s == "-1"
      return [newLabel = "All Vendors"]
    else
      vendor = @report.current_user.company.vendors.find(@report.params[EfsReports::CriteriaVendor.criteria_id].to_i)

      if vendor.present?
        return ["Vendor: #{vendor.name}"]
      else
        return ["No Vendor Selected"]
      end
    end
  end
end