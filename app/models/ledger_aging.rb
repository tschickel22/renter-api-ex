class LedgerAging < ApplicationRecord
  self.table_name = "ledger_aging"

  def past_due
    [0, bucket_2 + bucket_3 + bucket_4].max
  end

  def past_due_on
    bucket_4
  end
end