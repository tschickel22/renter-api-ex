class RiReports::AmountBilled < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Amount Billed"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::AmountBilled::AmountBilledDetail]
    super
  end
end