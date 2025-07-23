class UpdateScreeningStatuses

  def self.enqueue(lease_resident_id)
    Resque.enqueue_to("screening_reports", UpdateScreeningStatuses, lease_resident_id)
  end

  def self.perform(lease_resident_id = nil)
    if lease_resident_id.nil?
      run_for_everything()
    else
      run_for_lease_resident(lease_resident_id)
    end
  end

  def self.run_for_everything
    LeaseResident.where(external_screening_status: RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_IN_PROGRESS).each do | lr |
      UpdateScreeningStatuses.enqueue(lr.id)
    end
  end

  def self.run_for_lease_resident(lease_resident_id)
    lease_resident = LeaseResident.find(lease_resident_id)

    api = RenterInsightTransUnionApi.new(lease_resident.lease.company)
    api.update_screening_request_residents_statuses(lease_resident)

    # If we are in "ReportsRequested" state, go find out the state of each report Reports/Status
    if lease_resident.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_IN_PROGRESS
      reports_statuses = api.get_reports_statuses(lease_resident)

      if reports_statuses.present? && reports_statuses.is_a?(Array) && reports_statuses.length > 0 && reports_statuses.collect{|r| r["serviceStatus"]}.uniq ==  ["ReportCompleted"]
        lease_resident.update_attribute(:external_screening_status, RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_SUCCESS)
        lease_resident.evaluate_current_step
      end
    end

    if lease_resident.external_screening_status == RenterInsightTransUnionApi::SCREENING_STATUS_REPORTS_DELIVERY_SUCCESS
      HandleScreeningReportUpdate.pull_reports(lease_resident_id)
    end
  end
end