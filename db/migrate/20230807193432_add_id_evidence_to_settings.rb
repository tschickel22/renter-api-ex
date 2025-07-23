class AddIdEvidenceToSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :settings, :additional_identification_evidence, :string, after: :application_include_identification, default: "none"
  end
end
