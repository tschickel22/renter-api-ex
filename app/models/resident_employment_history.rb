class ResidentEmploymentHistory < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Resident"}

  attr_accessor :optional_by_setting

  belongs_to :resident

  validates :resident_id, presence: true
  validates :employment_status, presence: true, unless: :optional_by_setting
  validates :company_name, presence: true, unless: :optional_by_setting
  validates :contact_name, presence: true, unless: :optional_by_setting
  validates :contact_phone, presence: true, unless: :optional_by_setting
  validates :months_at_company, presence: true, unless: :optional_by_setting

  EMPLOYMENT_STATUS_EMPLOYED = 'employed'
  EMPLOYMENT_STATUS_SELF_EMPLOYED = 'self_employed'
  EMPLOYMENT_STATUS_UNEMPLOYED = "unemployed"
  EMPLOYMENT_STATUS_STUDENT = 'student'
  EMPLOYMENT_STATUS_RETIRED = "retired"


  EMPLOYMENT_STATUS_OPTIONS = {ResidentEmploymentHistory::EMPLOYMENT_STATUS_EMPLOYED => 'Employed', ResidentEmploymentHistory::EMPLOYMENT_STATUS_SELF_EMPLOYED => 'Self-Employed', ResidentEmploymentHistory::EMPLOYMENT_STATUS_UNEMPLOYED => 'Unemployed', ResidentEmploymentHistory::EMPLOYMENT_STATUS_STUDENT => 'Student', ResidentEmploymentHistory::EMPLOYMENT_STATUS_RETIRED => 'Retired'}
  TIME_AT_OPTIONS = {6 => '6 Months', 12 => '1 Year', 18 => '1.5 Years', 24 => '2 Years', 36 => '2+ Years'}

  def self.public_fields
    [:id, :resident_id] + ResidentEmploymentHistory.form_fields
  end

  def self.form_fields
    [:employment_status, :company_name, :contact_name, :contact_phone, :months_at_company]
  end

  def to_builder
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end
    end
  end
end