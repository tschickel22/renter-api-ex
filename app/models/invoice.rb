class Invoice < PermanentRecord
  before_create :generate_hash

  belongs_to :company
  belongs_to :property
  belongs_to :lease

  attr_accessor :initial_balance, :items, :invoice_name, :invoice_street, :invoice_city, :invoice_state, :invoice_zip

  validates :invoice_on, uniqueness: { scope: [:lease_id] }

  def self.for_user(current_user)
    Invoice.joins(:property).where(property: Property.for_user(current_user).active)
  end

  def self.create_for_lease(lease, invoice_on)
    invoice = Invoice.where(lease_id: lease.id, invoice_on: invoice_on).first_or_initialize

    if invoice.new_record?
      invoice.company_id = lease.company_id
      invoice.property_id = lease.property_id
    end

    invoice.update_amount
    invoice.save

    return invoice
  end

  def update_amount
    # Find balance at the time of invoice creation
    start_at = self.created_at || Time.now
    self.initial_balance = lease.ledger_balance(start_at)
    self.items = lease.resident_ledger_items.where(transaction_at: ((start_at + 1.second)..(invoice_on + 1.day))).order(:transaction_at)
    balance = self.initial_balance

    self.items.each do |item|
      balance += item.amount
      item.balance = balance
    end

    self.amount = balance
  end

  def prepare_for_display
    update_amount()

    settings = self.lease.settings

    if settings.invoice_name_type == "property"
      self.invoice_name = property.name
      self.invoice_street = property.street
      self.invoice_city = property.city
      self.invoice_state = property.state
      self.invoice_zip = property.zip
    elsif settings.invoice_name_type == "custom"
      self.invoice_name = settings.invoice_custom_name
      self.invoice_street = settings.invoice_custom_street
      self.invoice_city = settings.invoice_custom_city
      self.invoice_state = settings.invoice_custom_state
      self.invoice_zip = settings.invoice_custom_zip
    else
      self.invoice_name = company.name
      self.invoice_street = company.street
      self.invoice_city = company.city
      self.invoice_state = company.state
      self.invoice_zip = company.zip
    end
  end

  def self.public_fields
    []
  end

  def self.private_fields
    [:hash_id, :invoice_on, :amount, :created_at, :invoice_name, :invoice_street, :invoice_city, :invoice_state, :invoice_zip]
  end

  def to_builder
    Jbuilder.new do |json|

      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.name self.invoice_on.strftime("%B %Y")
      json.lease_hash_id self.lease.hash_id

      json.initial_balance self.initial_balance
      json.items self.items.collect{|i| i.to_builder.attributes!}
    end
  end
end
