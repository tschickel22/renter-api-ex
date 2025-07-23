class ReportDisclaimer < ApplicationRecord
  def self.public_fields
    []
  end

  def self.private_fields
    [:disclaimer]
  end
end
