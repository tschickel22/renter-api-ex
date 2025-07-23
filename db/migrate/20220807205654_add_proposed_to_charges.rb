class AddProposedToCharges < ActiveRecord::Migration[6.1]
  def change
    add_column :charges, :proposed, :boolean, default: false, after: :prorated
  end
end
