class RiReports::Aging < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Aging"
    self.criteria_classes = [EfsReports::CriteriaProperty]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::Aging::AgingDetail]
    super
  end
end