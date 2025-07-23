class ExternalLeaseDocument < ParanoidRecord
    belongs_to :company
    belongs_to :lease
    belongs_to :resident
end