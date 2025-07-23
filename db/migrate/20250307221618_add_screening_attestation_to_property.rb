class AddScreeningAttestationToProperty < ActiveRecord::Migration[6.1]
  def change
    add_column :properties, :screening_attestation, :json
  end
end
