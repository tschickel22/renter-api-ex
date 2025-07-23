class HandleScreeningReportUpdate

  def self.enqueue(raw_data)
    Resque.enqueue_in_with_queue("screening_reports", 60, HandleScreeningReportUpdate, raw_data)
  end

  def self.perform(raw_data)
    data = JSON.parse(raw_data)

    lease_resident = LeaseResident.where(external_screening_id: data['ScreeningRequestRenterId']).first

    # Was this a Manual Authentication?  If so, notify the resident
    if !data['ManualAuthenticationStatus'].blank?
      HandleScreeningReportUpdate.update_identity_verification(lease_resident)
    else
      HandleScreeningReportUpdate.pull_reports(lease_resident.id)
    end
  end

  def self.pull_reports(lease_resident_id)
    lease_resident = LeaseResident.find(lease_resident_id)

    HandleScreeningReportUpdate.pull_reports_for_resident_audience(lease_resident)
    HandleScreeningReportUpdate.pull_reports_for_property_audience(lease_resident)
  end

  def self.update_identity_verification(lease_resident)
    api = RenterInsightTransUnionApi.new(lease_resident.lease.company)
    api.update_screening_request_residents_statuses(lease_resident)

    if lease_resident.current_step == LeaseResident::STEP_PAYMENT
      ResidentMailer.manual_identity_verification_passed(lease_resident.id).deliver
    elsif lease_resident.current_step == LeaseResident::STEP_SCREENING_READY_FOR_REPORTS

      # Now, request for reports
      api.request_report_generation(lease_resident)

      # Update Statuses
      api.update_screening_request_residents_statuses(lease_resident)
    end
  end

  private

  def self.pull_reports_for_resident_audience(lease_resident)
    api = RenterInsightTransUnionApi.new(lease_resident.lease.company)

    #
    # RESIDENT REPORTS
    #
    credit_score = nil
    criminal_record_count = nil
    eviction_count = nil

    report_data = api.get_resident_reports(lease_resident)

    if report_data.present?

      report_data.each do | report_type, report_details |
        if report_details
          lease_resident_report = lease_resident.lease_resident_reports.where(report_type: report_type, audience: LeaseResidentReport::AUDIENCE_RESIDENT).first_or_initialize

          lease_resident_report.report_content_type = 'html'
          lease_resident_report.report_content = report_details['reportResponseModelDetails']
          lease_resident_report.save

          if report_type == "Credit"
            credit_score = HandleScreeningReportUpdate.read_credit_score(lease_resident_report.report_content)
          elsif report_type == "Criminal"
            criminal_record_count = HandleScreeningReportUpdate.read_criminal_record_count(lease_resident_report.report_content)
          elsif report_type == "Eviction"
            eviction_count = HandleScreeningReportUpdate.read_eviction_count(lease_resident_report.report_content)
          end
        end
      end
    end

    updates = {}

    updates[:credit_score] = credit_score if credit_score.present?
    updates[:criminal_record_count] = criminal_record_count if criminal_record_count.present?
    updates[:eviction_count] = eviction_count if eviction_count.present?

    if updates.keys.count > 0
      lease_resident.assign_attributes(updates)
      lease_resident.save(validate: false)
    end
  end

  def self.pull_reports_for_property_audience(lease_resident)
    api = RenterInsightTransUnionApi.new(lease_resident.lease.company)

    #
    # PROPERTY REPORTS
    #
    report_data = api.get_landlord_reports(lease_resident)

    if report_data.present?

      report_data.each do | report_type, report_details |
        if report_details
          lease_resident_report = lease_resident.lease_resident_reports.where(report_type: report_type, audience: LeaseResidentReport::AUDIENCE_PROPERTY).first_or_initialize

          lease_resident_report.report_content_type = 'html'
          lease_resident_report.report_content = report_details['reportResponseModelDetails']
          lease_resident_report.save
        end
      end
    end
  end

  def self.read_credit_score(report_content)
    return read_html_integer(report_content.first['reportData'], "score-value")
  end

  def self.read_criminal_record_count(report_content)
    criminal_record_count = read_html_integer(report_content.first['reportData'], "criminal-report-summary-criminal-record-count")
    criminal_record_count ||= report_content.to_s.include?("Case:") ? 1 : 0

    return criminal_record_count
  end

  def self.read_eviction_count(report_content)
    eviction_count = read_html_integer(report_content.first['reportData'], "eviction-report-summary-eviction-record-count")
    eviction_count ||= report_content.to_s.include?("Detailed Eviction Proceeding") ? 1 : 0
    return eviction_count
  end

  def self.read_html_integer(html, attribute_text)

    start_pos = html.index(attribute_text)

    if start_pos.present?
      start_pos = html.index(">", start_pos + 1) + 1
      end_pos = html.index("<", start_pos)

      score = html.slice(start_pos, end_pos - start_pos)

      return score.to_i
    else
      return nil
    end
  end
end