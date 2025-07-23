class RiReports::AmountReceived < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Amount Received"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::AmountReceived::AmountReceivedDetail]
    super
  end
end