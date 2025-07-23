class RiReports::ExpensePayments < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Bill Payments"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::ExpensePayments::ExpensePaymentsDetail]
    super
  end
end