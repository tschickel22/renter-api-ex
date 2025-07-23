include WorkerHelper

class GenerateCreditBuilderEnrollment
  def self.perform()
    log("*** START #{self}")

    # Find all active properties that have not been submitted to TU for Credit Builder
    properties = Property.active.joins(:company).where(enrolled_for_credit_builder_on: nil)

    log("Found #{properties.length} properties")

    properties_to_send = []

    properties.each do | property |
      if property.company.is_paying?
        properties_to_send << property
      end
    end

    log("#{properties_to_send.length} properties are fully active")

    if !properties_to_send.empty?
      filename = "trans-union-properties-#{Time.now.to_i}"
      rows = [
        CSV.generate_line(["Property Company Name", "Long name to Display", "Short name Display", "Servicer's Dispute address", "Servicer's Dispute City", "Servicer's Dispute State", "Servicer's Dispute Zip code", "Servicer's Dispute Phone #", "Identification number"], {force_quotes: true})
      ]

      properties_to_send.each do | property |
        row = []

        row << property.company.name
        row << property.name.slice(0,40)
        row << property.name.slice(0,12)
        row << "2809 Cherry St."
        row << "Denver"
        row << "CO"
        row << "80207"
        row << "303-586-4420"
        row << RenterInsightTransUnionApi.generate_property_id(property)

        rows << CSV.generate_line(row, {force_quotes: true})
      end

      File.open("export/#{filename}.csv", "w") do | f|
        f.write(rows.join(""))
      end

      # Send the file to Tom
      SystemMailer.credit_builder_enrollment("#{filename}.csv").deliver!

      # Mark all properties as submitted
      properties_to_send.each do | property |
        property.enrolled_for_credit_builder_on = PaymentService.todays_date()
        property.save(validate: false)
      end
    end

    log("*** END #{self}")
  end
end