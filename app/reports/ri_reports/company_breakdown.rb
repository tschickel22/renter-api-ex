class RiReports::CompanyBreakdown < EfsReports::EfsReport

  def initialize(args)
    self.title = "Internal Report for Tom"
    self.criteria_classes = [EfsReports::CriteriaDateRange]
    self.section_classes = [EfsReports::HeaderSection, RiReports::CompanyBreakdown::CompanySummary]
    super
  end

  def admins_only
    true
  end
end