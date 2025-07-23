class RiReports::RecurringPayments < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Auto-Pay Report"
    self.criteria_classes = [EfsReports::CriteriaProperty]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::RecurringPayments::RecurringPaymentsDetail]
    super
  end
end