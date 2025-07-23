class PropertyService
  require 'roo'

  def self.import_from_spreadsheet(company, file_path)
    xlsx = Roo::Spreadsheet.open(file_path)

    # Find the header
    headers = nil
    rows = []
    xlsx.sheet(xlsx.default_sheet).each(expected_columns) do | row |
      if headers.nil?
        headers = row
      else
        rows << row
      end
    end

    return import_units(company, rows)

  end

  def self.import_units(company, rows)
    properties = []

    # This is a list of units... and properties may be generated along the way
    rows.each do | row |
      errors = []
      property = nil
      
      ActiveRecord::Base.transaction do

        #
        # PROPERTY
        #
        property = company.properties.where(name: row[:property_name]).first_or_initialize

        property.property_type = row[:property_type].downcase if !row[:property_type].blank?
        property.ownership_type = nil
        property.ownership_type = Property::OWNERSHIP_TYPE_OWNED if UploadService.is_true(row[:property_ownership_type_owned])
        property.ownership_type = Property::OWNERSHIP_TYPE_MANAGED if UploadService.is_true(row[:property_ownership_type_managed])

        errors << property.errors.full_messages if !property.valid?

        #
        # PROPERTY OWNERS
        #
        property_owner_1 = company.property_owners.where(name: row[:property_owner_1_name]).first_or_initialize

        if !property_owner_1.save
          errors << ["Property Owner 1: " + property_owner_1.errors.full_messages.join(", Property Owner 1: ")]
        end

        if !row[:property_owner_2_name].blank?
          property_owner_2 = company.property_owners.where(name: row[:property_owner_2_name]).first_or_initialize

          if !property_owner_2.save
            errors << ["Property Owner 2: " + property_owner_2.errors.full_messages.join(", Property Owner 2: ")]
          end
        else
          property_owner_2 = nil
        end

        #
        # PROPERTY OWNERSHIPS
        #
        property_ownership_1 = property.property_ownerships.where(property_owner: property_owner_1).first_or_initialize
        property_ownership_1.property_owner = property_owner_1
        property_ownership_1.percentage = UploadService.percentage(row[:property_owner_1_pct])
        total_percentage = property_ownership_1.percentage

        if property_owner_2.present?
          property_ownership_2 = property.property_ownerships.where(property_owner: property_owner_2).first_or_initialize
          property_ownership_2.property_owner = property_owner_2
          property_ownership_2.percentage = UploadService.percentage(row[:property_owner_2_pct])
          total_percentage += property_ownership_2.percentage
        end

        errors << "Total Ownership Percentage must add up to 100%" if total_percentage != 100

        #
        # UNIT
        #
        unit = property.units.where(unit_number: row[:unit_number]).first_or_initialize
        unit.street = row[:unit_street]
        unit.city = row[:unit_city]
        unit.state = row[:unit_state]
        unit.zip = row[:unit_zip]
        unit.floor_plan_name = row[:unit_floor_plan_name]
        unit.beds = (row[:unit_beds].to_s == "Studio" ? Unit::BEDS_STUDIO : row[:unit_beds])
        unit.baths = row[:unit_baths]
        unit.square_feet = row[:unit_square_feet]

        errors << unit.errors.full_messages if !unit.valid?

        if errors.empty?
          if property.save
            if unit.save
              # SUCCESS!
            else
              errors << unit.errors.full_messages
            end
          else
            errors << property.errors.full_messages
          end
        end
      end

      if errors.empty?
        row[:status] = 'success'
        row[:message] = "Unit Saved"
        properties << property
      else
        row[:status] = 'error'
        row[:message] = errors.flatten.join(", ")
      end
    end

    properties.uniq.each do | property |
      ActivateForScreening.enqueue(Property.to_s, property.id, nil) if !property.screening_is_activated?
      ActivateForInsurance.enqueue(Property.to_s, property.id, nil) if property.external_insurance_id.blank?
    end

    return rows
  end

  def self.expected_columns
    {
      property_name: "Property Name",
      property_type: "Property Type (Apartment, Condo, House, Duplex)",
      property_owner_1_name: "1st Owner Name",
      property_owner_1_pct: "1st Ownership %",
      property_owner_2_name: "2nd Owner Name",
      property_owner_2_pct: "2nd Ownership %",
      property_ownership_type_owned: "Is Property Owned",
      property_ownership_type_managed: "Is Property Managed Only",
      unit_street: "Street",
      unit_city: "City",
      unit_state: "State",
      unit_zip: "Zip",
      unit_number: "Unit Number",
      unit_floor_plan_name: "Floorplan Name",
      unit_beds: "#Bedrooms",
      unit_baths: "#Bathrooms",
      unit_square_feet: "Square Feet",
    }
  end
end