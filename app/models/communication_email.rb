class CommunicationEmail < Communication

  before_create :log_raw_email

  validates :body, presence: true

end
