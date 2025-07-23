class Announcement < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}
  before_save :generate_hash

  belongs_to :sent_by_user, class_name: 'User'
  has_many :announcement_recipients

  accepts_nested_attributes_for :announcement_recipients, allow_destroy: true

  validates :subject, presence: true
  validates :body, presence: true
  validates :send_when, presence: true

  attr_accessor :attachments_batch_number
  has_many_attached :attachments

  serialize :mediums, Array

  STATUS_DRAFT = 'draft'
  STATUS_QUEUED = 'queued'
  STATUS_SENDING = 'sending'
  STATUS_SENT = 'sent'

  SEND_WHEN_IMMEDIATELY = 'immediately'
  SEND_WHEN_SCHEDULED = 'scheduled'

  def time_to_deliver?
    if self.send_when == Announcement::SEND_WHEN_SCHEDULED && self.send_at.present?
      setting = Setting.where(company_id: self.company_id, property_id: nil).first
      time_zone = setting&.time_zone || 'US/Mountain'
      return self.send_at.strftime('%Y-%m-%d %H:%M') <= Time.now.in_time_zone(time_zone).strftime('%Y-%m-%d %H:%M')
    end
  end

  # Load all lease resident objects for the Company, Property and LeaseResident recipients
  def determine_recipient_lease_residents(search_text = nil)
    lease_residents = []

    announcement_recipients.each do | announcement_recipient |
      if announcement_recipient.recipient_type == Company.to_s || announcement_recipient.recipient_type == Property.to_s
        leases = Lease.for_user(sent_by_user).includes(lease_residents: :resident)

        if announcement_recipient.recipient_type == Property.to_s
          leases = leases.where(property_id: announcement_recipient.recipient.id)
        end

        if [Lease::STATUS_FUTURE, Lease::STATUS_CURRENT, Lease::STATUS_FORMER].include?(announcement_recipient.recipient_conditions["status"])
          leases = leases.where(status: announcement_recipient.recipient_conditions["status"])
        end

        leases = leases.joins({lease_residents: :resident}).where(["concat(residents.first_name, ' ', residents.last_name) like :search_text", {search_text: "%#{search_text}%"}]) if !search_text.blank?

        leases.each do | lease |
          lease.lease_residents.each do | lease_resident |
            lease_residents << lease_resident if [LeaseResidentPrimary, LeaseResidentSecondary].include?(lease_resident.class)
          end
        end

      elsif announcement_recipient.recipient_type == LeaseResident.to_s
        if !search_text.blank?
          search_lease_resident = LeaseResident.joins(:resident).where(["concat(residents.first_name, ' ', residents.last_name) like :search_text", {search_text: "%#{search_text}%"}])
          lease_residents << search_lease_resident.first if search_lease_resident.exists?
        else
          lease_residents << announcement_recipient.recipient
        end
      end
    end

    return lease_residents.uniq
  end

  def self.for_user(current_user)
    if current_user
      if current_user.is_resident?
        Announcement.where("1=0")
      else
        Announcement.where(company_id: current_user.company_id)
      end
    else
      Announcement.where("1=0")
    end
  end

  def prepare_body(recipient)
    new_body = self.body.clone

    if recipient.is_a?(LeaseResident)
      new_body.gsub!("{resident_first_name}", recipient.resident.first_name)
      new_body.gsub!("{resident_last_name}", recipient.resident.last_name)
    end

    return new_body
  end

  def display_summary
    if sent_at.present?
      "Sent at #{sent_at.strftime('%m/%d/%Y %l:%M %p')}"
    elsif status == Announcement::STATUS_DRAFT
      "Draft"
    elsif send_when == Announcement::SEND_WHEN_IMMEDIATELY
      "Scheduled for immediate delivery"
    else
      "Scheduled for #{send_at.strftime('%m/%d/%Y %l:%M %p')}"
    end

  end
  def communications
    Communication.where(related_object: self)
  end

  def self.public_fields
    [:subject, :body, :mediums, :send_when, :send_at, :status]
  end

  def self.private_fields
    [:id, :hash_id, :company_id, :created_at, :updated_at, :sent_at]
  end

  def self.attachment_builder(attachment)
    Jbuilder.new do |json|
      json.id attachment.id
      json.filename attachment.filename.to_s
      json.content_type attachment.content_type
      json.url Rails.application.routes.url_helpers.url_for(attachment)
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

      json.sent_by_name sent_by_user&.short_name
      json.recipient_summary "#{announcement_recipients.count} #{'Recipient'.pluralize(announcement_recipients.count)}"
      json.display_summary display_summary
      json.attachment_count self.attachments.count

      if level == "full"
        json.announcement_recipients self.announcement_recipients.collect{|ar| ar.to_builder.attributes!}
      end
    end
  end
end
