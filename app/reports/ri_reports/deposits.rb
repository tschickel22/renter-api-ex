class RiReports::Deposits < EfsReports::EfsReport

  def initialize(args)
    self.title = "Deposits"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::Deposits::DepositDetail]
    super
  end
end