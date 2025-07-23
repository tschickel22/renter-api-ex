class RiReports::BalanceSheet < EfsReports::EfsReport

  def initialize(args)
    self.title = "Balance Sheet"
    self.criteria_classes = [EfsReports::CriteriaDatePicker, EfsReports::CriteriaProperty, EfsReports::CriteriaAccountingMethod]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::BalanceSheet::BalanceSheetDetail]
    super
  end
end