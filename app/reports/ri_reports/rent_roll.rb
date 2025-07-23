class RiReports::RentRoll < EfsReports::EfsReport

  def initialize(args)
    self.title = "Rent Roll"
    self.criteria_classes = [EfsReports::CriteriaProperty, EfsReports::CriteriaUnitStatus]
    self.section_classes = [EfsReports::FinancialNav, EfsReports::HeaderSection, RiReports::RentRoll::RentRollByUnit]
    self.report_wrapper_class = 'x-scrollable-section'
    super
  end
end