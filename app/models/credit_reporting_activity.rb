class CreditReportingActivity < PermanentRecord

  CREDIT_BUILDER_STATUS_ACTIVE = 'active'
  CREDIT_BUILDER_STATUS_INACTIVE = 'inactive'
  CREDIT_BUILDER_STATUS_OPTIONS = {CreditReportingActivity::CREDIT_BUILDER_STATUS_ACTIVE => 'Active', CreditReportingActivity::CREDIT_BUILDER_STATUS_INACTIVE => 'Inactive'}

  belongs_to :resident

  def self.public_fields
    [:amount_reported, :reported_on]
  end

  def self.private_fields
    []
  end
end
