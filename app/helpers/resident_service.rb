include ApplicationHelper

class ResidentService
  require 'roo'

  def self.format_phone_number(phone)
    return phone if phone.blank?
    phone = phone.gsub(/^\+\d/, '').gsub(/[^0-9]/, '')
    phone = "#{phone[0..2]}-#{phone[3..5]}-#{phone[6..9]}"

    return phone
  end

  def self.import_from_spreadsheet(company, file_path)
    xlsx = Roo::Spreadsheet.open(file_path)

    # Find the header
    headers = nil
    rows = []
    begin
      xlsx.sheet(xlsx.default_sheet).each(ResidentService.expected_columns) do | row |
        if headers.nil?
          headers = row
        else
          rows << row
        end
      end
    rescue
      Rails.logger.error("UPLOAD FAILED: #{$!.message}")
      return [{status: 'error', message: 'The proper upload template was not used.'}]
    end

    return import_residents(company, rows)

  end

  def self.import_residents(company, rows)
    # This is a list of residents
    rows.each do | row |
      errors = []

      ActiveRecord::Base.transaction do

        #
        # PROPERTY
        #
        row[:property_name] = UploadService.clean_string(row[:property_name])

        if !row[:property_id].blank?
          property = company.properties.where(id: row[:property_id]).first
        else
          property = company.properties.where(name: row[:property_name]).first
        end

        if !row[:unit_id].blank?
          unit = property.units.where(id: row[:unit_id]).first if property.present?
        else
          unit = property.units.where(unit_number: row[:unit_number]).first if property.present?
        end


        #
        # LEASE
        #
        if property.nil?
          errors << "Property #{row[:property_name]} not found"
        elsif unit.nil?
          errors << "Unit #{row[:property_name]} / #{row[:unit_number]} not found"
        elsif row[:outstanding_balance_amount].nil?
          errors << "Please enter the outstanding balance"
        else

          # If a unit_id is specified, a user is adding this lease manually
          if row[:unit_id].present?
            lease = Lease.where(property_id: property.id, unit_id: unit.id).new
          else
            lease = Lease.where(property_id: property.id, unit_id: unit.id).first_or_initialize
          end

          row = parse_mmddyy_param(row, [:lease_start_on, :lease_end_on])

          lease.company_id = company.id
          lease.rent = row[:lease_rent].abs if row[:lease_rent].present?
          lease.security_deposit = row[:lease_deposits_held].abs if row[:lease_deposits_held].present?
          lease.security_deposit_paid = lease.security_deposit
          lease.lease_start_on = row[:lease_start_on]
          lease.move_in_on = lease.lease_start_on
          lease.lease_end_on = row[:lease_end_on]

          if row[:lease_term].present? && ['mtm','month-to-month', 'month to month'].include?(row[:lease_term].to_s.downcase)
            lease.lease_term = Lease::TERM_MONTH_TO_MONTH
          else
            lease.lease_term = row[:lease_term] || 12
          end

          lease.screening_payment_responsibility = "resident"
          lease.lease_action = Lease::ACTION_ADD_EXISTING
          lease.status = (lease.move_in_on.present? && lease.move_in_on <= PaymentService.todays_date() ? Lease::STATUS_CURRENT : Lease::STATUS_FUTURE)

          if lease.save
            primary_resident = LeaseResident.where(lease_id: lease.id, type: LeaseResidentPrimary.to_s).first_or_initialize
            primary_resident.current_step = LeaseResident::STEP_SUBMITTED
            primary_resident.resident ||= Resident.new

            primary_resident.resident.first_name = row[:primary_resident_first_name]
            primary_resident.resident.last_name = row[:primary_resident_last_name]
            primary_resident.resident.email = UploadService.clean_email(row[:primary_resident_email])
            primary_resident.resident.phone_number = UploadService.clean_phone(row[:primary_resident_phone])

            if primary_resident.save
              if !UploadService.remove_invalid_responses(row[:co_resident_1_first_name]).blank?
                secondary_resident_1 = lease.secondary_residents.joins(:resident).where(resident: {first_name: row[:co_resident_1_first_name], last_name: row[:co_resident_1_last_name]}).first_or_initialize
                secondary_resident_1.current_step = LeaseResident::STEP_SUBMITTED
                secondary_resident_1.resident ||= Resident.new

                secondary_resident_1.resident.first_name = row[:co_resident_1_first_name]
                secondary_resident_1.resident.last_name = row[:co_resident_1_last_name]
                secondary_resident_1.resident.email = UploadService.clean_email(row[:co_resident_1_email])
                secondary_resident_1.resident.phone_number = UploadService.clean_phone(row[:co_resident_1_phone])

                if secondary_resident_1.save

                  if !UploadService.remove_invalid_responses(row[:co_resident_2_first_name]).blank?
                    secondary_resident_2 = lease.secondary_residents.joins(:resident).where(resident: {first_name: row[:co_resident_2_first_name], last_name: row[:co_resident_2_last_name]}).first_or_initialize
                    secondary_resident_2.current_step = LeaseResident::STEP_SUBMITTED
                    secondary_resident_2.resident ||= Resident.new

                    secondary_resident_2.resident.first_name = row[:co_resident_2_first_name]
                    secondary_resident_2.resident.last_name = row[:co_resident_2_last_name]
                    secondary_resident_2.resident.email = UploadService.clean_email(row[:co_resident_2_email])
                    secondary_resident_2.resident.phone_number = UploadService.clean_phone(row[:co_resident_2_phone])

                    if secondary_resident_2.save
                      # Everything looks good so far!
                    else
                      errors << "Secondary Resident 2: " + lease.errors.full_messages.join(", Secondary Resident 2: ")
                    end
                  end
                else
                  errors << "Secondary Resident 1: " + lease.errors.full_messages.join(", Secondary Resident 1: ")
                end
              end
            else
              errors << "Primary Resident: " + primary_resident.errors.full_messages.join(", Primary Resident: ")
            end
          else
            errors << lease.errors.full_messages
          end
        end

        # Now add the ancillary data (pets, vehicles)
        if primary_resident.present?
          if !UploadService.remove_invalid_responses(row[:vehicle_1_make]).blank?
            vehicle_1 = primary_resident.resident.resident_vehicles.where(make: row[:vehicle_1_make]).first_or_initialize
            vehicle_1.model = UploadService.remove_invalid_responses(row[:vehicle_1_model])
            vehicle_1.year = UploadService.remove_invalid_responses(row[:vehicle_1_year])
            vehicle_1.color = UploadService.remove_invalid_responses(row[:vehicle_1_color])
            vehicle_1.plate_number = UploadService.remove_invalid_responses(row[:vehicle_1_license])
            vehicle_1.parking_spot = UploadService.remove_invalid_responses(row[:vehicle_1_parking_space])

            if !vehicle_1.save
              errors << "Vehicle 1: " + vehicle_1.errors.full_messages.join(", Vehicle 1: ")
            end
          end

          if !UploadService.remove_invalid_responses(row[:vehicle_2_make]).blank?
            vehicle_2 = primary_resident.resident.resident_vehicles.where(make: row[:vehicle_2_make]).first_or_initialize
            vehicle_2.model = UploadService.remove_invalid_responses(row[:vehicle_2_model])
            vehicle_2.year = UploadService.remove_invalid_responses(row[:vehicle_2_year])
            vehicle_2.color = UploadService.remove_invalid_responses(row[:vehicle_2_color])
            vehicle_2.plate_number = UploadService.remove_invalid_responses(row[:vehicle_2_license])
            vehicle_2.parking_spot = UploadService.remove_invalid_responses(row[:vehicle_2_parking_space])

            if !vehicle_2.save
              errors << "Vehicle 2: " + vehicle_2.errors.full_messages.join(", Vehicle 2: ")
            end
          end

          if !UploadService.remove_invalid_responses(row[:pet_1_type]).blank?
            pet_1 = primary_resident.resident.resident_pets.where(pet_type: row[:pet_1_type].downcase).first_or_initialize
            pet_1.name = UploadService.remove_invalid_responses(row[:pet_1_name])
            pet_1.weight = UploadService.remove_invalid_responses(row[:pet_1_weight])
            pet_1.breed = UploadService.remove_invalid_responses(row[:pet_1_breed])
            pet_1.color = UploadService.remove_invalid_responses(row[:pet_1_color])

            if !pet_1.save
              errors << "Pet 1: " + pet_1.errors.full_messages.join(", Pet 1: ")
            end
          end

          if !UploadService.remove_invalid_responses(row[:pet_2_type]).blank?
            pet_2 = primary_resident.resident.resident_pets.where(pet_type: row[:pet_2_type].downcase).first_or_initialize
            pet_2.name = UploadService.remove_invalid_responses(row[:pet_2_name])
            pet_2.weight = UploadService.remove_invalid_responses(row[:pet_2_weight])
            pet_2.breed = UploadService.remove_invalid_responses(row[:pet_2_breed])
            pet_2.color = UploadService.remove_invalid_responses(row[:pet_2_color])

            if !pet_2.save
              errors << "Pet 2: " + pet_2.errors.full_messages.join(", Pet 2: ")
            end
          end
        end

        if errors.empty?
          # Everything saved... so now, handle the rest
          deposit_charge = ResidentCharge.build_unique_charge(ChargeType::DEPOSIT, Charge::FREQUENCY_ONE_TIME, lease, lease.security_deposit, lease.lease_start_on, false, false)
          deposit_charge.backdated = true
          deposit_charge.save

          # Add the Rent charge
          rent_charge = ResidentCharge.build_unique_charge(ChargeType::RENT, Charge::FREQUENCY_MONTHLY, lease, lease.rent, lease.lease_start_on, lease.settings.prorate_rent_at_lease_start_and_end, false)
          rent_charge.backdated = true
          rent_charge.save

          # Are there other charges?
          if !UploadService.remove_invalid_responses(row[:monthly_fee_1_name]).blank? && UploadService.decimal(row[:monthly_fee_1_amount], 0) != 0
            monthly_charge_1 = ResidentCharge.build_unique_charge_with_description(ChargeType::FEES, row[:monthly_fee_1_name], Charge::FREQUENCY_MONTHLY, lease, UploadService.decimal(row[:monthly_fee_1_amount]).abs, lease.lease_start_on)
            monthly_charge_1.backdated = true
            monthly_charge_1.save
          end

          if !UploadService.remove_invalid_responses(row[:monthly_fee_2_name]).blank? && UploadService.decimal(row[:monthly_fee_2_amount], 0) != 0
            monthly_charge_2 = ResidentCharge.build_unique_charge_with_description(ChargeType::FEES, row[:monthly_fee_2_name], Charge::FREQUENCY_MONTHLY, lease, UploadService.decimal(row[:monthly_fee_2_amount]).abs, lease.lease_start_on)
            monthly_charge_2.backdated = true
            monthly_charge_2.save
          end

          # Make sure everything is posted first
          lease.unposted_charges.each do | charge |
            charge.update({due_on: lease.lease_start_on})
            AccountingService.push_to_ledger(charge)
          end

          # Now, enter a manual payment for the security deposit
          if lease.security_deposit > 0 && !ResidentPayment.where(lease_id: lease.id).exists? && lease.lease_start_on <= PaymentService.todays_date()
            deposit_payment = ResidentPayment.new_for_lease_resident(primary_resident)
            deposit_payment.payment_at = deposit_charge.due_on  + 13.hours
            deposit_payment.amount = lease.security_deposit
            deposit_payment.status = Payment::STATUS_MANUAL
            deposit_payment.extra_info = "Imported"
            deposit_payment.save

            AccountingService.push_to_ledger(deposit_payment)
          end

          # Now, ensure the balance is correct.
          if row[:outstanding_balance_amount].present?
            balance_as_of = lease.ledger_balance(Date.today)

            # Is there a difference? If so, enter an adjustment
            if balance_as_of != UploadService.decimal(row[:outstanding_balance_amount])
              difference = UploadService.decimal(row[:outstanding_balance_amount]) - balance_as_of

              adjustment = ResidentCharge.build_unique_charge_with_description(ChargeType::RENT, "Imported Resident Balance Adjustment", Charge::FREQUENCY_ONE_TIME, lease, difference, PaymentService.todays_date())
              adjustment.save(validate: false)

              AccountingService.push_to_ledger(adjustment)
            end
          end
        end

        if errors.empty?

          # Send any necessary email
          if !row[:invite_to_portal].blank? && !['n', 'no', 'false'].include?(row[:invite_to_portal].to_s.downcase)
            lease.primary_resident.update({invitation_sent_at: Time.now})
            ResidentMailer.portal_access_granted(lease.primary_resident.id).deliver

            lease.secondary_residents.each do | secondary_resident |
              secondary_resident.update({invitation_sent_at: Time.now})
              ResidentMailer.portal_access_granted(secondary_resident.id).deliver
            end
          end

          row[:lease_hash_id] = lease.hash_id
          row[:status] = 'success'
          row[:message] = "Lease Saved"
        else
          row[:status] = 'error'
          row[:message] = errors.flatten.join(", ")
        end

      end
    end

    return rows
  end

  def self.expected_columns
    {
      property_name: "Property Name",
      unit_number: "Unit",
      primary_resident_first_name: "Resident First Name",
      primary_resident_last_name: "Resident Last Name",
      primary_resident_email: "Resident Email",
      primary_resident_phone: "Resident Phone",
      co_resident_1_first_name: "Co- Resident First Name",
      co_resident_1_last_name: "Co- Resident Last Name",
      co_resident_1_email: "Co-Resident Email",
      co_resident_1_phone: "Co-Resident Phone",
      co_resident_2_first_name: "2nd Co- Resident First Name",
      co_resident_2_last_name: "2nd Co- Resident Last Name",
      co_resident_2_email: "2nd Co- Resident Email",
      co_resident_2_phone: "2nd Co- Resident Phone",
      lease_term: "Lease Term",
      lease_start_on: "Lease Start Date",
      lease_end_on: "Lease End Date",
      lease_deposits_held: "Deposits On Hand",
      lease_rent: "Monthly Rent",
      monthly_fee_1_name: "Other Monthly Fee",
      monthly_fee_1_amount: "Other Monthly Fee Amount",
      monthly_fee_2_name: "2nd Other Monthly Fee",
      monthly_fee_2_amount: "2nd Other Monthly Fee Amount",
      outstanding_balance_amount: "Outstanding Balance",
      vehicle_1_make: "Vehicle Make",
      vehicle_1_model: "Vehicle Model",
      vehicle_1_year: "Vehicle Year",
      vehicle_1_color: "Vehicle Color",
      vehicle_1_license: "Vehicle License Plate",
      vehicle_1_parking_space: "Parking Space #",
      vehicle_2_make: "2nd Vehicle Make",
      vehicle_2_model: "2nd Vehicle Model",
      vehicle_2_year: "2nd Vehicle Year",
      vehicle_2_color: "2nd Vehicle Color",
      vehicle_2_license: "2nd Vehicle License Plate",
      vehicle_2_parking_space: "2nd Parking Space #",
      pet_1_type: "Pet Type",
      pet_1_name: "Pet Name",
      pet_1_weight: "Pet Weight",
      pet_1_breed: "Pet Breed",
      pet_1_color: "Pet Color",
      pet_2_type: "2nd Pet Type",
      pet_2_name: "2nd Pet Name",
      pet_2_weight: "2nd Pet Weight",
      pet_2_breed: "2nd Pet Breed",
      pet_2_color: "2nd Pet Color",
      invite_to_portal: "Invite Resident to Portal",
    }
  end
end