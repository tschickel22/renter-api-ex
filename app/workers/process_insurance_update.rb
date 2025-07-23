class ProcessInsuranceUpdate
  def self.enqueue(data)
    Resque.enqueue_to("insurance", self, data)
  end

  def self.perform(data)
    data.deep_symbolize_keys!

    # If we need to look up by policy number: ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/PersPolicy/PolicyNumber')
    # NOT NEEDED PERHAPS external_property_insurance_id = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/Location/Addr/MSI_CommunityID')
    # NOT NEEDED PERHAPS _property = Property.where(external_insurance_id: external_property_insurance_id).first if !external_property_insurance_id.blank?

    lease_resident_hash_id = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/InsuredOrPrincipal/GeneralPartyInfo/NameInfo/PersonName/OtherGivenName')
    lease_resident = LeaseResident.where(hash_id: lease_resident_hash_id).first if !lease_resident_hash_id.blank?

    if lease_resident.present?
      insurance = Insurance.where(lease_resident_id: lease_resident.id, api_partner_id: RenterInsightMsiApi::API_PARTNER_ID).last
      insurance.policy_number = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/PersPolicy/PolicyNumber')
      insurance.external_id = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/MSI_PolicyTransactions/MSI_PolicyTransaction/PolicyTransactionID')

      effective_date = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/PersPolicy/ContractTerm/EffectiveDt')
      insurance.effective_on = Date.strptime(effective_date, '%m/%d/%Y')

      expiration_date = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/PersPolicy/ContractTerm/ExpirationDt')
      insurance.expires_on = Date.strptime(expiration_date, '%m/%d/%Y')

      insurance.insurance_company_name = "Millennial Specialty Insurance"
      external_status = ApiProcessor.read_xml_string(data, 'InsuranceSvcRs/RenterPolicyQuoteInqRs/PersPolicy/MSI_PolicyStatus')

      if PaymentService.todays_date() >= insurance.expires_on || ['Cancelled'].include?(external_status)
        insurance.status = Insurance::STATUS_INACTIVE
      else
        insurance.status = Insurance::STATUS_ACTIVE
      end

      insurance.save
    end

    return insurance
  end
end