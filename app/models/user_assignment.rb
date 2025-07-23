class UserAssignment < ApplicationRecord
  has_paper_trail versions: {class_name: "Versions::User"}

  belongs_to :user
  belongs_to :entity, polymorphic: true
end
