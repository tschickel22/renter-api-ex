class RenameRefundModeCheck < ActiveRecord::Migration[6.1]
  def change
    execute "UPDATE leases SET security_deposit_refund_mode = '#{Lease::REFUND_MODE_PAPER_CHECK_HANDWRITTEN}' WHERE security_deposit_refund_mode = 'paper_check'"
  end
end
