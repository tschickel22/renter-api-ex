class RiReports::TrialBalance < EfsReports::EfsReport

  def initialize(args)
    self.title = "Trial Balance"
    self.criteria_classes = [EfsReports::CriteriaDateRange, EfsReports::CriteriaProperty, EfsReports::CriteriaAccountingMethod]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::TrialBalance::TrialBalanceDetail]
    super
  end
end