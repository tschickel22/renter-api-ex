class ResidentLedgerItem < LedgerItem
  def self.create_for_charge(charge, transaction_at, amount = nil)
    amount ||= charge.prorated ? charge.prorated_amount : charge.amount
    ledger_item = ResidentLedgerItem.create({ company_id: charge.company_id, property_id: charge.property_id, lease_id: charge.lease_id, related_object: charge, amount: amount, transaction_at: (transaction_at.to_date + charge.ledger_offset)})
    AccountingService.generate_entry(ledger_item)

    return ledger_item
  end
end