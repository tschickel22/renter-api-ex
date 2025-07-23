class RiReports::CashFlowStatement < EfsReports::EfsReport

  def initialize(args)
    self.title = "Statement Of Cash Flow"
    self.criteria_classes = [EfsReports::CriteriaDateRange, EfsReports::CriteriaProperty, EfsReports::CriteriaAccountingMethod, EfsReports::CriteriaGroupByMethod]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::CashFlowStatement::CashFlowStatementDetail]
    self.report_wrapper_class = 'x-scrollable-section'
    super
  end
end