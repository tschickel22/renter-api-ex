class RiReports::Expenses < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Expenses"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::Expenses::ExpenseDetail]
    super
  end
end