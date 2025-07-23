class ApplyLateFees
  include ApplicationHelper

  def self.enqueue(lease_id)
    Resque.enqueue_to("billing", ApplyLateFees, lease_id)
  end

  def self.perform(lease_id = nil)
    puts "*** START #{self.to_s} ****"

    if lease_id.nil?
      # Find all current leases, determine if there is a balance due and whether or not a late fee should be added
      Lease.includes(:resident_ledger_items).where(status: Lease::STATUS_CURRENT).each do | lease |
        self.enqueue(lease.id)
      end
    else
      AccountingService.generate_late_fee(Lease.find(lease_id), true)
    end
  end
end