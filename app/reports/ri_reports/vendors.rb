class RiReports::Vendors < EfsReports::EfsReport

  def initialize(args)
    self.title = "Vendors"
    self.criteria_classes = []
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::Vendors::VendorSummary]
    super
  end
end