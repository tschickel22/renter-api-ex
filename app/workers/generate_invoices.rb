class GenerateInvoices
  include ApplicationHelper

  def self.perform()
    puts "*** START #{self.to_s} ****"

    # Find all leases that need to go current
    leases = Lease.joins(:company, :property).where(status: Lease::STATUS_CURRENT, company: {payments_onboard_status: Company::PAYMENT_ONBOARDING_STATUS_COMPLETED}, property: {status: Property::STATUS_ACTIVE})

    leases.each do | lease |
      if lease.settings.enable_invoices
        Invoice.create_for_lease(lease, Date.today.end_of_month + 1.day)
      end
    end
  end

  def self.generate_past_invoices(lease)
    lease_start_date = lease.move_in_on || lease.lease_start_on
    if lease.is_current? && lease_start_date < Date.today
      current_date = lease_start_date

      while current_date < Date.today && (lease.move_out_on.nil? || current_date <= lease.move_out_on)
        invoice_on = current_date.end_of_month + 1.day
        invoice = Invoice.create_for_lease(lease, invoice_on)

        invoice.created_at = (invoice_on - 1.month) + 25.day
        invoice.update_amount()
        invoice.save

        current_date += 1.month
      end
    end
  end
end