class ParseLeadEmail
  include WorkerHelper

  def self.enqueue(message)
    Resque.enqueue_to("process_inbound_email", self, message)
  end

  def self.perform(message, api_partner_id)
    log("*** START ParseLeadEmail")

    body = CommunicationLog.get_message_body(message, true)

    run(body, api_partner_id)

    log("*** END ParseLeadEmail")
  end

  def self.run(body, api_partner_id)
    lead_details = ParseLeadEmail.parse_lead_text(body)

    # Try to find the property or unit by address
    if api_partner_id == RenterInsightDwellsyApi::API_PARTNER_ID
      property, unit = RenterInsightDwellsyApi.new.lead_email_find_property_and_unit(lead_details)
      field_names = RenterInsightDwellsyApi.new.lead_email_field_names
      lead_source = LeadSource.where(name: LeadSource::NAME_DWELLSY).first

    elsif api_partner_id == RenterInsightRentApi::API_PARTNER_ID
      property, unit = RenterInsightRentApi.new.lead_email_find_property_and_unit(lead_details)
      field_names =  RenterInsightRentApi.new.lead_email_field_names
      lead_source = LeadSource.where(name: LeadSource::NAME_RENT).first

    elsif api_partner_id == RenterInsightRentalSourceApi::API_PARTNER_ID
    elsif api_partner_id == RenterInsightZillowApi::API_PARTNER_ID
      # Re-parse lead details for Zillow
      lead_details = RenterInsightZillowApi.new.parse_lead_text(body)
      property, unit = RenterInsightZillowApi.new.lead_email_find_property_and_unit(lead_details)
      field_names = RenterInsightZillowApi.new.lead_email_field_names
      lead_source = LeadSource.where(name: LeadSource::NAME_ZILLOW).first

    elsif api_partner_id == RenterInsightZumperApi::API_PARTNER_ID
      property, unit = RenterInsightZumperApi.new.lead_email_find_property_and_unit(lead_details)
      field_names = RenterInsightZumperApi.new.lead_email_field_names
      lead_source = LeadSource.where(name: LeadSource::NAME_ZUMPER).first

    end

    if property.present?
      # We can create a lead now
      resident = Resident.new()
      resident.first_name = lead_details[field_names[:first_name]]
      resident.last_name = lead_details[field_names[:last_name]]
      resident.email = lead_details[field_names[:email]]
      resident.phone_number = ResidentService.format_phone_number(lead_details[field_names[:phone]])

      lead_info = LeadInfo.new(company_id: property.company_id)
      lead_info.move_in_on = Date.strptime(lead_details[field_names[:move_in_on]], field_names[:move_in_on_fmt]) if !lead_details[field_names[:move_in_on]].blank?
      lead_info.lead_source = lead_source
      lead_info.comment = body.strip # Maybe we should rip out all used details?

      lease = Lease.new(company_id: property.company_id, property_id: property.id, unit_id: unit&.id)
      lease.lease_action = Lease::ACTION_ADDING_LEAD

      lease.primary_resident = LeaseResidentPrimary.new(resident: resident, lead_info: lead_info, current_step: LeaseResident::STEP_LEAD)

      # Perform the updates that occur when this happens via the UI
      LeaseService.handle_before_create_save(lease, _current_user = nil)
      lease.save
      LeaseService.handle_after_create_or_update(lease, _current_user = nil)

    end
  end

  protected

  def self.parse_lead_text(body)
    lines = body.split("\n")

    # Only keep stuff like Unit ID: 3123
    lines.inject({}) do | acc, line |
      if line.include?(':')
        parts = line.split(':')
        acc[parts.first.strip] = parts.slice(1,999).join(':').strip
      end

      acc
    end
  end
end