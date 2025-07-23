class ActivateForScreening
  def self.enqueue(class_name, id, user_id)
    Resque.enqueue_to("activation", ActivateForScreening, class_name, id, user_id)
  end

  def self.perform(class_name, id, user_id)
    puts("*** Start #{self.to_s} #{class_name} #{id} ***")

    if class_name == Company.to_s
      self.run_for_company(id, user_id)

      puts("*** End #{self.to_s} #{class_name} #{id} ***")
    elsif class_name == Property.to_s
      result = self.run_for_property(id, user_id)
      puts("*** End #{self.to_s} #{class_name} #{id} ***")

      return result
    end
  end

  def self.run_for_company(company_id, user_id)
    company = Company.find(company_id)
    user = User.find(user_id)

    if !company.screening_is_activated?

      api = RenterInsightTransUnionApi.new(company)

      if api.sync_company(company, user, nil)
        # Queue up all properties for activation
        company.properties.each do | property |
          ActivateForScreening.perform(Property.to_s, property.id, user_id)
        end
      end
    end

    return company.screening_is_activated?
  end

  def self.run_for_property(property_id, _user_id)
    property = Property.find(property_id)

    if property.external_screening_id.blank?
      api = RenterInsightTransUnionApi.new(property.company)

      api.sync_property(property)

      if !property.external_screening_id.blank?
        attestation_data = RenterInsightTransUnionApi.new.get_property_attestations(property)

        if attestation_data.present? && attestation_data["attestations"].blank?

          # Are there questions that need answering? If not, save empty responses and move on
          new_attestation_data = {attestationGroupId: attestation_data['attestationGroupId'], attestationResponses: []}

          property.screening_attestation = new_attestation_data
          property.save(validate: false)
        end
      end
    end

    return !property.external_screening_id.blank?
  end

end