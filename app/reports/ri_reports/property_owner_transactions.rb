class RiReports::PropertyOwnerTransactions < EfsReports::EfsReport

  def initialize(args)
    self.title = "Owner Transactions"
    self.criteria_classes = [EfsReports::CriteriaPropertyOwner, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::PropertyOwnerTransactions::PropertyOwnerTransactionDetail]
    super
  end
end