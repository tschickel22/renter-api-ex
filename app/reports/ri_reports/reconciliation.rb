class RiReports::Reconciliation < EfsReports::EfsReport

  def initialize(args)
    self.title = ""
    self.criteria_classes = [EfsReports::CriteriaAccountReconciliation]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::Reconciliation::ReconciliationHeader, RiReports::Reconciliation::ReconciliationSummary, RiReports::Reconciliation::ReconciliationDetail, RiReports::Reconciliation::ReconciliationDetailUncleared]
    super
  end
end