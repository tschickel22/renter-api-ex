class RiReports::GeneralLedger < EfsReports::EfsReport

  def initialize(args)
    self.title = "General Ledger"
    self.criteria_classes = [EfsReports::CriteriaDateRange, EfsReports::CriteriaProperty, EfsReports::CriteriaAccountingMethod]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::GeneralLedger::GeneralLedgerDetail]
    super
  end
end