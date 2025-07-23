class RiReports::ManualPayments < EfsReports::EfsReport
  
  def initialize(args)
    self.title = "Applied Payments"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::ManualPayments::ManualPaymentsDetail]
    super
  end
end