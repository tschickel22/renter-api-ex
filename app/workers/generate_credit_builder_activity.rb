include WorkerHelper

class GenerateCreditBuilderActivity
  def self.perform()
    log("*** START #{self}")

    # If we aren't able to connect to the SFTP server, no need to continue
    test_sftp_connection()

    # Find all active properties that have not been submitted to TU for Credit Builder
    properties = Property.active.joins(:company).where.not(external_credit_builder_id: nil)
    property_ids = []

    log("Found #{properties.length} properties")

    properties.each do | property |
      if property.company.is_paying? && !property.external_credit_builder_id.blank?
        property_ids << property.id
      end
    end

    lease_by_company = Lease.current_future_or_former.where(property_id: property_ids).where("rent > 0").inject({}) do | acc, lease |
      acc[lease.company_id] ||= []
      acc[lease.company_id].push(lease)
      acc
    end

    residents_reported = {}

    if !lease_by_company.empty?
      filename = "trans-union-residents-#{Time.now.to_i}.txt"
      rows = []

      lease_by_company.each do | company_id, leases |
        leases.each do | lease |

          next if !lease.primary_resident.resident.eligible_for_credit_reporting?

          aging = LedgerAging.where(lease_id: lease.id).first

          # Only report on folks < 30 days past due
          next if aging.nil? || aging.past_due > 0

          row = []

          row << " " * 4 # Record Length
          row << " " * 1 # Processing Indicator
          row << Time.now.in_time_zone('US/Mountain').strftime('%m%d%Y%H%M%S') # Time Stamp
          row << " " * 1 # Correction Indicator
          row << RenterInsightTransUnionApi.generate_property_id(lease.property).ljust(20, " ") # Property Identification Number
          row << " " * 2 # Cycle Identifier
          row << lease.hash_id.ljust(30, " ") # Property Identification Number # Rental/Lease Number
          row << "O" # Rental/Lease Type
          row << "29" # Rental/Lease Agreement Type
          row << lease.lease_start_on.strftime('%m%d%Y') # Rental/Lease Obligation Start Date
          row << " " * 9 # Credit Limit
          row << lease.rent.to_i.to_s.rjust(9, "0") # Highest Credit or Original Loan Amount
          row << "001" # Rental/Lease Duration
          row << "M" # Terms Frequency
          row << lease.rent.to_i.to_s.rjust(9, "0") # Scheduled Monthly Payment Amount
          row << calculate_total_rent_paid_past_month(lease).to_i.to_s.rjust(9, "0") # Actual Payment Amount
          row << calculate_lease_status_code(lease, aging) # Account Status
          row << calculate_lease_payment_code(lease, aging) # Payment Rating
          row << build_lease_rental_history_profile(lease) # Payment History Profile
          row << " " * 2 # Special Comment
          row << " " * 2 # Compliance Condition Code
          row << [lease.ledger_balance(Date.today).to_i, 0].max.to_s.rjust(9, "0") # Current Balance
          row << (aging&.past_due || 0).to_i.to_s.rjust(9, "0") # Amount Past Due
          row << "0" * 9 # Original Charge‐Off Amount
          row << (lease.last_payment_on.present? && lease.last_payment_on <= PaymentService.todays_date() ? lease.last_payment_on.strftime('%m%d%Y') : " " * 8) # Date of Account Information
          row << " " * 8 # Date of First Delinquency
          row << (lease.move_out_on.present? && lease.move_out_on <= PaymentService.todays_date() ? lease.move_out_on.strftime('%m%d%Y') : " " * 8) # Date Closed
          row << (lease.last_payment_on.present? && lease.last_payment_on <= PaymentService.todays_date() ? lease.last_payment_on.strftime('%m%d%Y') : " " * 8) # Date of Last Payment * GOOD
          row << " " * 1 # Interest Type Indicator
          row << " " * 17 # Reserved
          row << lease.primary_resident.resident.last_name.slice(0,25).ljust(25, " ") # Tenant Surname
          row << lease.primary_resident.resident.first_name.slice(0,20).ljust(20, " ") # Tenant First Name
          row << (lease.primary_resident.resident.middle_name || "").slice(0,20).ljust(20, " ") # Tenant Middle Name
          row << calculate_generation_code(lease.primary_resident.resident) # Generation Code
          row << (lease.primary_resident.resident.tax_id || "").gsub('-', '').slice(0, 9).ljust(9, " ") # Tenant Social Security Number
          row << (lease.primary_resident.resident.date_of_birth_on.present? ? lease.primary_resident.resident.date_of_birth_on.strftime('%m%d%Y') : " " * 8) # Tenant Date of Birth
          row << (lease.primary_resident.resident.phone_number || "").gsub('-', '').slice(0, 10).ljust(10, " ") # Tenant Telephone Number
          row << "1" # Rental/Lease Relationship Code
          row << " " * 2 # Reserved
          row << "US" # Country Code
          row << lease.unit.street.slice(0, 32).ljust(32, " ") # First Line of Address
          row << (lease.unit.unit_number || "").slice(0, 32).ljust(32, " ") # Second Line of Address
          row << lease.unit.city.slice(0, 20).ljust(20, " ") # City
          row << lease.unit.state.slice(0, 2).ljust(2, " ") # State
          row << lease.unit.zip.slice(0, 9).ljust(9, " ") # Postal / Zip Code
          row << " " # Address Indicator
          row << "R" # Residence Code

          residents_reported[lease.primary_resident.resident] = calculate_total_rent_paid_past_month(lease)

          # Find the first qualifying secondary resident
          secondary_resident = lease.secondary_residents.find{|lr| lr.resident&.eligible_for_credit_reporting? }&.resident

          if secondary_resident.present?
            row << "J1" # Segment Identifier
            row << " " # Reserved
            row << secondary_resident.last_name.slice(0,25).ljust(25, " ") # Tenant Surname
            row << secondary_resident.first_name.slice(0,20).ljust(20, " ") # Tenant First Name
            row << (secondary_resident.middle_name || "").slice(0,20).ljust(20, " ") # Tenant Middle Name
            row << calculate_generation_code(secondary_resident) # Generation Code
            row << (secondary_resident.tax_id || "").gsub('-', '').slice(0, 9).ljust(9, " ") # Tenant Social Security Number
            row << (secondary_resident.date_of_birth_on.present? ? secondary_resident.date_of_birth_on.strftime('%m%d%Y') : " " * 8) # Tenant Date of Birth
            row << (secondary_resident.phone_number || "").gsub('-', '').slice(0, 10).ljust(10, " ") # Tenant Telephone Number
            row << "2" # ECOA Code
            row << " " * 2 # Consumer Information Indicator
            row << " " * 2 # Reserved

            residents_reported[secondary_resident] = calculate_total_rent_paid_past_month(lease)
          end

          row[0] = row.join("").length.to_s.rjust(4, "0")
          rows << row.join("")
        end
      end

      header_row = []

      header_row << " " * 4 # Record Length
      header_row << "HEADER" # Record Identifier Report
      header_row << " " * 2 # Reserved
      header_row << " " * 10 # Reserved
      header_row << " " * 10 # Reserved
      header_row << " " * 5 # Reserved
      header_row << "2K1Y".ljust(10, " ") # TransUnion Program Identifier
      header_row << PaymentService.todays_date.strftime('%m%d%Y') # Effective (Activity) Date
      header_row << PaymentService.todays_date.strftime('%m%d%Y') # Date Created
      header_row << PaymentService.todays_date.strftime('%m%d%Y') # Program Date
      header_row << " " * 8 # Reserved
      header_row << "Renter Insight".slice(0, 40).ljust(40, " ") # Property Management Name
      header_row << "2809 Cherry St., Denver, CO 80207".slice(0, 96).ljust(96, " ") # Property Management Address
      header_row << "303-586-4420".gsub('-', '').slice(0, 10).ljust(10, " ") # Property Management Phone Number
      header_row << " " * 40 # Reserved
      header_row << " " * 5 # Reserved
      header_row << " " * 10 # Reserved
      header_row << " " * 146 # Reserved

      header_row[0] = header_row.join("").length.to_s.rjust(4, "0")

      local_path = "export"

      # Write it to a local file
      File.open("#{local_path}/#{filename}", "w") do | f|
        f.write(header_row.join("") + "\n")
        f.write(rows.join("\n"))
      end

      # Send it off to TU
      push_to_sftp(local_path, filename)

      # Mark all leases as submitted
      residents_reported.each do | resident, past_due |
        cra = CreditReportingActivity.where(resident_id: resident.id, reported_on: PaymentService.todays_date(), api_partner_id: RenterInsightTransUnionApi::API_PARTNER_ID).first_or_initialize
        cra.amount_reported = past_due
        cra.save
      end
    end

    log("*** END #{self}")
  end

  def self.calculate_lease_status_code(lease, aging)
    allow_negativity = false

=begin
    11‐ Current account / less than 30 days late (0‐29 days past the due date)
    13‐ Paid/Closed account
    71‐ Account 30‐59 days past the due date
    78‐ Account 60‐89 days past the due date
    80‐ Account 90‐119 days past the due date
    82‐ Account 120‐149 days past the due date
    83‐ Account 150‐179 days past the due date
    84‐ Account 180 or more days past the due date
=end
    if lease.is_former?
      return "13"
    elsif !allow_negativity
      return "11"
    elsif aging.present? && aging.bucket_4 > 0
      return "80"
    elsif aging.present? && aging.bucket_3 > 0
      return "78"
    elsif aging.present? && aging.bucket_2 > 0
      return "71"
    else
      return "11"
    end
  end

  def self.calculate_lease_payment_code(lease, aging)
    allow_negativity = false

=begin
  0‐ Current account / less than 30 days late (0‐29 days past the due date)
  1‐ 30‐59 days past the due date
  2‐ 60‐89 days past the due date
  3‐ 90‐119 days past the due date
  4‐ 120‐149 days past the due date
  5‐ 150‐179 days past the due date
  6‐ 180 or more days past the due date
  G‐ Collection
  L‐ Charge‐off
=end
    if !lease.is_former?
      return " " * 1
    elsif !allow_negativity
      return "0"
    elsif aging.bucket_4 > 0
      return "3"
    elsif aging.bucket_3 > 0
      return "2"
    elsif aging.bucket_2 > 0
      return "1"
    else
      return "0"
    end
  end

  def self.calculate_generation_code(resident)
    if resident.suffix == "Jr."
      return "J"
    elsif resident.suffix == "II"
      return "2"
    elsif resident.suffix == "III"
      return "3"
    elsif resident.suffix == "IV"
      return "4"
    else
      return " " * 1
    end
  end

  def self.calculate_total_rent_paid_past_month(lease)
    payment_ledger_ids = lease.resident_ledger_items.where(related_object_type: Payment.to_s).where("transaction_at >= now() - interval 30 day").pluck(:id)
    return [0, AccountEntry.joins(:cash_account).where(accounts: {code: Account::CODE_RENTAL_INCOME}, related_object_type: LedgerItem.to_s, related_object_id: payment_ledger_ids).sum(:amount)].max
  end

  def self.build_lease_rental_history_profile(lease)
    allow_negativity = false


    if !lease.resident_ledger_items.empty?
      results = []
      history = {}
      balance = 0

      first_transaction_month = lease.resident_ledger_items.first.transaction_at.in_time_zone('US/Mountain').to_date.beginning_of_month

      last_open_on = nil
      lease.resident_ledger_items.each do | ledger_item|
        transaction_on = ledger_item.transaction_at.in_time_zone('US/Mountain').to_date
        month = transaction_on.beginning_of_month
        balance = balance + ledger_item.amount

        last_open_on = balance > 0 ? (last_open_on || transaction_on) : nil

        history[month] = {balance: balance, last_open_on: last_open_on}
      end

      # Go backwards from last month and build 24 months of history
      (1..240).reverse_each do | i |
        current_month = i.months.ago.to_date.beginning_of_month

        if current_month < first_transaction_month
          results << "B"
        else
          if history[current_month]
            last_open_on = history[current_month][:last_open_on]
          end

          # 0‐ 0‐29 days past due (current account)
          # 1‐ 30‐59 days past the due date
          # 2‐ 60‐89 days past the due date
          # 3‐ 90‐119 days past the due date
          # 4‐ 120‐149 days past the due date
          # 5‐ 150‐179 days past the due date
          # 6‐ 180 or more days past the due date
          if !allow_negativity || last_open_on.nil? || months_between(last_open_on, current_month) <= 0
            results << "0"
          elsif months_between(last_open_on, current_month) <= 1
            results << "1"
          elsif months_between(last_open_on, current_month) <= 2
            results << "2"
          elsif months_between(last_open_on, current_month) <= 3
            results << "3"
          elsif months_between(last_open_on, current_month) <= 4
            results << "4"
          elsif months_between(last_open_on, current_month) <= 5
            results << "5"
          else
            results << "6"
          end

        end
      end

      return results.reverse.slice(0,24).join("")
    else
      return "B" * 24
    end
  end

  def self.months_between(date1, date2)
    (date2.year * 12 + date2.month) - (date1.year * 12 + date1.month)
  end

  def self.test_sftp_connection()

    connection_confirmed = false
    host = Rails.application.credentials.dig(:trans_union, :sftp_host)
    username = Rails.application.credentials.dig(:trans_union, :sftp_username)
    password = Rails.application.credentials.dig(:trans_union, :sftp_password)

    Rails.logger.info "Trying to connect... #{host} #{username}"

    Net::SFTP.start(host, username, {password: password}) do |sftp|
      connection_confirmed = true
      sftp.channel.eof! # SFTP Server needs to receive EOF before closing channel
    end

    if !connection_confirmed
      raise "Could not connect to TU SFTP"
    end

    return true
  end

  def self.push_to_sftp(local_path, filename)

    host = Rails.application.credentials.dig(:trans_union, :sftp_host)
    username = Rails.application.credentials.dig(:trans_union, :sftp_username)
    password = Rails.application.credentials.dig(:trans_union, :sftp_password)
    remote_path = Rails.application.credentials.dig(:trans_union, :sftp_remote_path)

    Rails.logger.info "Trying to push... #{host} #{username}"

    Net::SFTP.start(host, username, {password: password}) do |sftp|
      sftp.upload!("#{local_path}/#{filename}", "#{remote_path}/#{filename}")
      sftp.channel.eof! # SFTP Server needs to receive EOF before closing channel
    end

    return true
  end

end