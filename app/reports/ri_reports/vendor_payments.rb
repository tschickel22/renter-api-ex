class RiReports::VendorPayments < EfsReports::EfsReport

  def initialize(args)
    self.title = "Vendor Payments"
    self.criteria_classes = [EfsReports::CriteriaVendor, EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::VendorPayments::VendorPaymentDetail]
    super
  end
end