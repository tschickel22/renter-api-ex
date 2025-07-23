class CreateScreeningRequests < ActiveRecord::Migration[6.1]
  def change
    create_table :screening_requests do |t|
      t.integer :company_id, index: true
      t.integer :property_id, index: true
      t.integer :lease_id, index: true
      t.string :external_screening_id
      t.string :external_bundle_id

      t.timestamps
    end

    add_column :lease_residents, :external_screening_id, :string, after: :current_step
    add_column :lease_residents, :external_screening_status, :string, after: :external_screening_id
    
  end
end
