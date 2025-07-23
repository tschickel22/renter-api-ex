class CreateCompanies < ActiveRecord::Migration[6.1]
  def change
    create_table :companies do |t|
      t.string :name

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
