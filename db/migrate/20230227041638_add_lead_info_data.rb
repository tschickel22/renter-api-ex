class AddLeadInfoData < ActiveRecord::Migration[6.1]
  def change
    add_column :lead_infos, :unit_listing_id, :integer, index: true, after: :move_in_on
    add_column :lead_infos, :reply_via_text, :boolean, after: :unit_listing_id
    add_column :lead_infos, :comment, :text, after: :reply_via_text
  end
end
