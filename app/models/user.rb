class User < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::User"}
  before_create :generate_hash

  has_one :resident
  belongs_to :company
  belongs_to :user_role
  has_many :user_assignments

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable,  and :omniauthable
  devise :database_authenticatable, :registerable, :trackable,
         :recoverable, :rememberable, :validatable, :confirmable

  TYPE_ADMIN = 'admin'
  TYPE_COMPANY_ADMIN = 'company_admin'
  TYPE_COMPANY_USER = 'company_user'
  TYPE_RESIDENT = 'resident'
  TYPE_OPTIONS = {User::TYPE_ADMIN => 'Admin', User::TYPE_COMPANY_ADMIN => 'Company Admin', User::TYPE_COMPANY_USER => 'Company User',  User::TYPE_RESIDENT => 'Resident'}

  validates :user_role_id, presence: true, if: :is_not_resident_or_admin?
  validates :first_name, presence: true
  validates :last_name, presence: true

  def name
    return full_name
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def short_name
    "#{first_name} #{last_name.slice(0, 1)}."
  end

  def is_admin?
    user_type == User::TYPE_ADMIN
  end

  def is_company_admin_at_least?
    return is_admin? || is_company_admin?
  end

  def is_company_admin?
    user_type == User::TYPE_COMPANY_ADMIN
  end

  def is_company_user_at_least?
    is_company_user? || is_company_admin_at_least?
  end

  def is_company_user?
    user_type == User::TYPE_COMPANY_USER
  end

  def is_not_resident_or_admin?
    user_type != User::TYPE_RESIDENT && !is_company_admin_at_least?
  end

  def is_property_owner?
    user_role&.name == UserRole::NAME_PROPERTY_OWNER
  end

  def is_resident?
    user_type == User::TYPE_RESIDENT
  end

  def phone_number
    self.cell_phone
  end

  def self.for_user(current_user)
    if current_user
      if current_user.is_admin?
        User.where.not(confirmed_at: nil)
      elsif current_user.is_company_admin?
        User.where(company_id: current_user.company_id).where.not(confirmed_at: nil)
      else
        User.where(id: current_user.id)
      end
    else
      User.where("1=0")
    end
  end

  def property_ids
    if self.is_property_owner?
      PropertyOwnership.where(property_owner_id: user_assignments.where(entity_type: PropertyOwner.to_s).collect{|up| up.entity_id}).pluck(:property_id)
    else
      user_assignments.where(entity_type: Property.to_s).collect{|up| up.entity_id}
    end
  end

  def property_owner_ids
    if self.is_property_owner?
      user_assignments.where(entity_type: PropertyOwner.to_s).collect{|up| up.entity_id}
    else
      []
    end
  end

  def update_reset_password_token
    self.set_reset_password_token
  end

  def destroy
    update_column(:email, "#{self.email}:destroyed:#{Time.now.to_i}")
    super
  end

  def self.public_fields
    [:id, :user_role_id, :email, :first_name, :last_name, :cell_phone]
  end

  def self.private_fields
    [:hash_id, :company_id, :user_type]
  end

  def to_builder(level = "none")
    Jbuilder.new do |json|
      self.class.public_fields().each do | field |
        json.(self, field)
      end

      self.class.private_fields().each do | field |
        json.(self, field)
      end

      json.name self.name
      json.user_role_name self.user_role&.name

      if level == "partial" || level == "full"
        json.company_name self.company&.name
      end

      # To make it easier on the front-end, build out permissions
      if level == "full"

        json.property_ids self.property_ids.join(",")
        json.property_owner_ids self.property_owner_ids.join(",")

        if self.is_admin? || self.is_resident?
          UserRole.permission_fields.each do | permission |
            json.set! "#{permission}_view", true
            json.set! "#{permission}_edit", true
            json.set! "#{permission}_delete", true
          end
        elsif self.user_role.present?
          UserRole.permission_fields.each do | permission |
            json.set! "#{permission}_view", [UserRole::ACCESS_LEVEL_VIEW, UserRole::ACCESS_LEVEL_EDIT, UserRole::ACCESS_LEVEL_DELETE].include?(self.user_role[permission])
            json.set! "#{permission}_edit", [UserRole::ACCESS_LEVEL_EDIT, UserRole::ACCESS_LEVEL_DELETE].include?(self.user_role[permission])
            json.set! "#{permission}_delete", [UserRole::ACCESS_LEVEL_DELETE].include?(self.user_role[permission])
          end
        end
      end
    end
  end
end
