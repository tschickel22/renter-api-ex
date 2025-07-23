class SendReminderEmails
  include ApplicationHelper

  def self.perform(mode)
    puts "*** START #{self.to_s} ****"

    # Find all leases that need to go current
    leases = Lease.joins(:company, :property).where(status: Lease::STATUS_CURRENT, company: {payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_COMPLETED}, property: {status: Property::STATUS_ACTIVE})

    leases.each do | lease |
      if lease.settings.rent_reminder_emails
        # Only send a reminder if there is a balance
        if lease.ledger_balance(LedgerItem.future_as_of()) > 0
          if mode == "advance_notice"
            ResidentMailer.rent_reminder(lease.id).deliver
          elsif mode == "first_of_month_notice"
            ResidentMailer.rent_due_today(lease.id).deliver if !lease.primary_resident.are_recurring_payments_active?
          elsif mode == "on_time_notice"
            ResidentMailer.rent_due(lease.id).deliver if !lease.primary_resident.are_recurring_payments_active?
          elsif mode == "late_notice"
            #ResidentMailer.rent_late(lease.id).deliver
          end
        end
      end
    end
  end
end