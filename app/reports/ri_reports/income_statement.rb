class RiReports::IncomeStatement < EfsReports::EfsReport

  def initialize(args)
    self.title = "Income Statement"
    self.criteria_classes = [EfsReports::CriteriaDateRange, EfsReports::CriteriaProperty, EfsReports::CriteriaAccountingMethod, EfsReports::CriteriaGroupByMethod]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::IncomeStatement::IncomeStatementDetail]
    super
  end
end