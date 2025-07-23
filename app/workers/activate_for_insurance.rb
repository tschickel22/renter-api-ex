class ActivateForInsurance
  def self.enqueue(class_name, id, user_id)
    Resque.enqueue_to("activation", ActivateForInsurance, class_name, id, user_id)
  end

  def self.perform(class_name, id, user_id)
    puts("*** Start #{self.to_s} #{class_name} #{id} ***")

    if class_name == Property.to_s
      result = self.run_for_property(id, user_id)
      puts("*** End #{self.to_s} #{class_name} #{id} ***")

      return result
    end
  end

  def self.run_for_property(property_id, _user_id)
    property = Property.find(property_id)

    if property.external_insurance_id.blank?
      api = RenterInsightMsiApi.new

      api.get_or_create_property(property)
    end

    return !property.external_insurance_id.blank?
  end

end