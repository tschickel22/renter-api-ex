class CreateResidentResidenceHistories < ActiveRecord::Migration[6.1]
  def change
    create_table :resident_residence_histories do |t|
      t.integer :resident_id, index: true
      t.string :street
      t.string :city
      t.string :state
      t.string :zip
      t.string :country
      t.integer :months_at_address
      t.string :residence_type

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
