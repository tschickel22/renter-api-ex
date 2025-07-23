class AddFieldsToResidenceHistories < ActiveRecord::Migration[6.1]
  def change
    add_column :resident_residence_histories, :landlord_name, :string, after: :residence_type
    add_column :resident_residence_histories, :landlord_phone, :string, after: :landlord_name
    add_column :resident_residence_histories, :landlord_email, :string, after: :landlord_phone
    add_column :resident_residence_histories, :monthly_rent, :integer, after: :landlord_email
  end
end
