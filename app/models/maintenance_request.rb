class MaintenanceRequest < PermanentRecord
  has_paper_trail versions: {class_name: "Versions::MaintenanceRequest"}
  include ApplicationHelper
  before_create :generate_long_hash

  belongs_to :company
  belongs_to :property
  belongs_to :assigned_to, polymorphic: true
  belongs_to :resident
  belongs_to :unit
  belongs_to :maintenance_request_category
  belongs_to :submitted_by, class_name: "User"
  has_many :expenses
  has_many_attached :photos

  validates :company_id, presence: true
  validates :property_id, presence: true
  validates :unit_id, presence: true
  validates :title, presence: true
  validates :description, presence: true

  validates :permission_to_enter, inclusion: [true, false], if: :submitted_by_resident
  validates :pets_in_unit, inclusion: [true, false], if: :permission_to_enter
  validates :pet_description, presence: true, if: :pets_in_unit_and_permission_to_enter

  validate :urgency_and_timing

  attr_accessor :photos_batch_number, :unread_comments

  STATUS_OPENED = 'open'
  STATUS_VENDOR_COMPLETE = 'vendor_complete'
  STATUS_CLOSED = 'closed'
  STATUS_OPTIONS= {MaintenanceRequest::STATUS_OPENED => "Open", MaintenanceRequest::STATUS_VENDOR_COMPLETE => "Vendor Complete", MaintenanceRequest::STATUS_CLOSED => "Closed"}

  URGENCY_LOW = 'low'
  URGENCY_NORMAL = 'normal'
  URGENCY_URGENT = 'urgent'
  URGENCY_OPTIONS = {MaintenanceRequest::URGENCY_LOW => "Low", MaintenanceRequest::URGENCY_NORMAL => "Normal", MaintenanceRequest::URGENCY_URGENT => "Urgent"}

  RECURRING_FREQUENCY_ONE_TIME = ''
  RECURRING_FREQUENCY_WEEKLY = 'weekly'
  RECURRING_FREQUENCY_MONTHLY = 'monthly'
  RECURRING_FREQUENCY_QUARTERLY = 'quarterly'
  RECURRING_FREQUENCY_YEARLY = 'yearly'
  RECURRING_FREQUENCY_OPTIONS = {MaintenanceRequest::RECURRING_FREQUENCY_WEEKLY => "Weekly", MaintenanceRequest::RECURRING_FREQUENCY_MONTHLY => "Monthly", MaintenanceRequest::RECURRING_FREQUENCY_QUARTERLY => "Quarterly", MaintenanceRequest::RECURRING_FREQUENCY_YEARLY => "Annually"}

  RESOLUTION_TIME_OPTIONS = {"08_12" => "8am - Noon", "12_16" => "Noon - 4pm", "16_20" => "4pm - 8pm"}

  def name
    title
  end

  def pets_in_unit_and_permission_to_enter
    pets_in_unit && permission_to_enter
  end

  def is_open?
    status == MaintenanceRequest::STATUS_OPENED
  end

  def is_vendor_completed?
    status == MaintenanceRequest::STATUS_VENDOR_COMPLETE
  end

  def is_closed?
    status == MaintenanceRequest::STATUS_CLOSED
  end

  def is_recurring?
    [MaintenanceRequest::RECURRING_FREQUENCY_WEEKLY, MaintenanceRequest::RECURRING_FREQUENCY_MONTHLY, MaintenanceRequest::RECURRING_FREQUENCY_QUARTERLY, MaintenanceRequest::RECURRING_FREQUENCY_YEARLY].include?(self.recurring_frequency)
  end

  def status_pretty
    label_lookup(status, MaintenanceRequest::STATUS_OPTIONS)
  end

  def urgency_pretty
    label_lookup(urgency, MaintenanceRequest::URGENCY_OPTIONS)
  end

  def submitted_by_resident
    submitted_by.present? && submitted_by.is_resident?
  end

  def lease
    if @lease.nil?
      @lease = Lease.current_or_future.where(unit_id: self.unit_id).first
    end

    return @lease
  end

  def urgency_and_timing
    if self.submitted_by_resident && self.urgency != MaintenanceRequest::URGENCY_URGENT && preferred_resolution_on.present?
      if new_record? && preferred_resolution_on <= PaymentService.todays_date
        self.errors.add(:preferred_resolution_on, "is too soon for the urgency level")
      elsif self.created_at.present? && preferred_resolution_on <= self.created_at.in_time_zone("US/Pacific").to_date
        self.errors.add(:preferred_resolution_on, "is too soon for the urgency level")
      end
    end
  end

  def self.for_user(current_user)
    if current_user
      if current_user.is_resident?
        MaintenanceRequest.where(resident_id: current_user.resident.id)
      else
        MaintenanceRequest.where(company_id: current_user.company_id)
      end
    else
      MaintenanceRequest.where("1=0")
    end
  end

  def self.public_fields
    [:property_id, :unit_id, :maintenance_request_category_id, :title, :description, :status, :urgency, :assigned_to_id, :assigned_to_type, :scheduled_on, :scheduled_time, :recurring_frequency, :internal_ticket, :permission_to_enter, :pets_in_unit, :pet_description, :preferred_resolution_on, :preferred_resolution_time]
  end

  def self.private_fields
    [:id, :hash_id, :company_id, :resident_id, :submitted_on, :closed_on, :vendor_completed_on, :updated_at, :unread_comments]
  end

  def self.photo_builder(photo)
    Jbuilder.new do |json|
      json.id photo.id
      json.filename photo.filename.to_s
      json.content_type photo.content_type
      json.url Rails.application.routes.url_helpers.url_for(photo)
    end
  end


  def to_builder(level = "full")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      if self.assigned_to.present?
        json.assigned_to self.assigned_to.to_builder.attributes!
        json.assigned_to_type_and_id "#{self.assigned_to_type}:#{self.assigned_to_id}"
      end

      if self.submitted_by.present?
        json.submitted_by self.submitted_by.to_builder.attributes!
      end

      json.resident self.resident.to_builder("partial").attributes! if self.resident.present?
      json.property self.property.to_builder("partial").attributes! if self.property.present?
      json.unit self.unit.to_builder("partial").attributes! if self.unit.present?
      json.maintenance_request_category self.maintenance_request_category.to_builder.attributes! if self.maintenance_request_category.present?

      # A helper... for sorting purposes
      json.urgent_and_updated_at "#{(self.urgency || MaintenanceRequest::URGENCY_LOW)}:#{self.updated_at}"

      if level == "full"
        json.expenses expenses.collect{|o| o.to_builder().attributes! }
      end
    end
  end
end
