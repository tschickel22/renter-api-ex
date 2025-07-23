class AddOptOutToResidents < ActiveRecord::Migration[6.1]
  def change
    add_column :residents, :text_opted_out_at, :datetime, after: :phone_number
  end
end
