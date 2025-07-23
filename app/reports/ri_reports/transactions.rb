class RiReports::Transactions < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Transactions"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::Transactions::TransactionDetail]
    super
  end
end