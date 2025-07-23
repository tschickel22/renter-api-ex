class ProcessLeaseChanges
  include ApplicationHelper

  def self.perform()
    puts "*** START #{self.to_s} ****"

    # Are there any companies with properties that need to be deactivated?
    companies_for_deactivation = Company.joins(:properties).where(properties: {status: Property::STATUS_ACTIVE}).where(["companies.subscription_status = :cancelled or (companies.subscription_status = :inactive AND companies.deactivated_at < now() - INTERVAL 60 day)", {cancelled: Company::SUBSCRIPTION_STATUS_CANCELLED, inactive: Company::SUBSCRIPTION_STATUS_INACTIVE}]).uniq

    companies_for_deactivation.each do | company |
      company.deactivate_all_properties()
    end

    # Find all renewed leases that need to go former
    # WHAT ABOUT THIS select original.hash_id, new_lease.hash_id from leases original, leases new_lease where new_lease.previous_lease_id = original.id and new_lease.status='current' and original.status='current' and new_lease.deleted_at is null and original.deleted_at is null
    leases = Lease.current.joins(:next_lease).where(next_lease: {status: Lease::STATUS_FUTURE}).where("leases.lease_end_on <= date(convert_tz(now(), 'UTC', 'US/Mountain'))")

    leases.each do | lease |
      LeaseService.roll_renewal_forward_to_next_lease(lease.next_lease)
    end

    # Find all leases that need to go current
    leases = Lease.future.where("(previous_lease_id IS NOT NULL OR move_in_on IS NOT NULL) AND lease_start_on <= date(convert_tz(now(), 'UTC', 'US/Mountain'))")

    leases.each do | lease |
      lease.move_in_on ||= PaymentService.todays_date()
      lease.status = Lease::STATUS_CURRENT
      lease.save
    end

    if PaymentService.todays_date().day == 24
      # Special Cases - On the 24th, we extend MTM leases
      leases = Lease.current.where(lease_term: Lease::TERM_MONTH_TO_MONTH).where("(previous_lease_id IS NOT NULL OR move_in_on IS NOT NULL) AND lease_start_on <= date(convert_tz(now(), 'UTC', 'US/Mountain'))")

      leases.each do | lease |
        # Now, make sure monthly charges are in the ledger
        monthly_charges = ResidentCharge.where(lease_id: lease.id, frequency: Charge::FREQUENCY_MONTHLY, proposed: false)

        monthly_charges.each do | charge |
          AccountingService.push_to_ledger(charge)
        end
      end
    end

    # Find all leases that are soon expiring and notify the company admins
    leases = Lease.current.where("lease_end_on = date(convert_tz(curdate() + interval 60 day, 'UTC', 'US/Mountain'))")

    leases.each do | lease |
      CompanyMailer.send_to_appropriate_users(:lease_expiring_soon, lease.property, lease.primary_resident.id)
    end

    # Cancel subscriptions for any moved-out residents
    Resident.where.not(external_subscription_id: nil).each do | resident |
      any_active_leases = false

      resident.leases.each do | lease |
        if lease.is_future?
          any_active_leases = true
        elsif lease.is_current_and_active?
          any_active_leases = true
        end
      end

      # No active leases? Cancel the subscription with Zoho
      if !any_active_leases
        if Rails.env.staging? || RenterInsightZohoApi.new.cancel_subscription(resident.external_subscription_id)
          resident.credit_builder_status = CreditReportingActivity::CREDIT_BUILDER_STATUS_INACTIVE
          resident.external_subscription_id = nil
          resident.save(validate: false)
          SystemMailer.application_error("Cancelled Zoho Subscription for Resident ##{resident.id}").deliver
        else
          SystemMailer.application_error("Unable to cancel Zoho Subscription for Resident ##{resident.id}").deliver
        end

      end
    end

    # Make sure unit statuses are correct
    Unit.all.each do | unit|
      unit.update_status
    end
  end
end